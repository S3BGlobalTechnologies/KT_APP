import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The free mind-analysis reading.
 *
 * Owned by the onboarding flow (app/onboarding.js): a new signup answers the
 * birth-detail steps and the reading is generated on the final screen. The chat
 * screen does not trigger it.
 *
 * Three webhooks, all authenticated with a bare `token` header — not
 * `Authorization: Bearer` — which is the convention across every authenticated
 * call in this app. Without it they return 401 {"message":"Access denied"}.
 */

// The whole repeat policy lives in this one constant.
export const MIND_ANALYSIS_REPEAT_AFTER_MS = 10 * 60 * 1000; // 10 minutes

// Local mirror of the server access record. Only read when the GET is unusable.
// Shape: {"userId": "...", "at": 1785319881614}
export const MIND_ANALYSIS_LAST_RUN_KEY = 'MIND_ANALYSIS_LAST_RUN_AT';

const maskToken = (token) => {
  const raw = String(token || '');
  if (!raw) return '(none)';
  if (raw.length <= 10) return `${raw.slice(0, 2)}…(${raw.length})`;
  return `${raw.slice(0, 6)}…${raw.slice(-4)} (${raw.length})`;
};

const asTrimmedString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

// Birth-detail numbers arrive as numbers or as already-padded strings depending
// on whether the profile came from /user-info or from the local save.
const asPaddedNumberString = (value, length) => {
  const raw = asTrimmedString(value);
  if (!raw) return '';
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return raw;
  return String(Math.trunc(numeric)).padStart(length, '0');
};

export const resolveMindAnalysisUserId = (profile) =>
  asTrimmedString(profile?._key || profile?.userId || profile?.id);

// Exactly the 13 fields the mind-analysis webhook expects, flat.
export const buildMindAnalysisPayload = (profile, sessionId, language) => ({
  sessionId: asTrimmedString(sessionId),
  full_name: asTrimmedString(profile?.fullName || profile?.name),
  gender: asTrimmedString(profile?.gender),
  day: asPaddedNumberString(profile?.day, 2),
  month: asPaddedNumberString(profile?.month, 2),
  year: asPaddedNumberString(profile?.year, 4),
  hour: asPaddedNumberString(profile?.hour, 2),
  min: asPaddedNumberString(profile?.min, 2),
  sec: asPaddedNumberString(profile?.sec ?? '00', 2),
  city: asTrimmedString(profile?.city),
  state: asTrimmedString(profile?.state),
  country: asTrimmedString(profile?.country),
  language: asTrimmedString(language) || 'English',
});

const MIND_ANALYSIS_ANSWER_KEYS = [
  'output',
  'answer',
  'message',
  'text',
  'response',
  'analysis',
];

// Probes the six answer keys at each level, then descends through result/data.
// Returns '' when nothing usable was found — a 200 with no string is a failure.
export const extractMindAnalysisAnswer = (value, depth = 0) => {
  if (depth > 6) return '';

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed && trimmed !== '{}' && trimmed !== '[]' ? trimmed : '';
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = extractMindAnalysisAnswer(entry, depth + 1);
      if (found) return found;
    }
    return '';
  }

  if (!value || typeof value !== 'object') return '';

  for (const key of MIND_ANALYSIS_ANSWER_KEYS) {
    const found = extractMindAnalysisAnswer(value[key], depth + 1);
    if (found) return found;
  }
  for (const key of ['result', 'data']) {
    const found = extractMindAnalysisAnswer(value[key], depth + 1);
    if (found) return found;
  }

  return '';
};

// The GET answers with an Arango envelope wrapped in an array:
// [{ "result": [ {...} ], "code": 201, "error": false, "hasMore": false }]
// Returns an array of records (empty = never read), or null when the body could
// not be understood at all, which is what triggers the local fallback.
export const parseAccessSessionRecords = (rawBody) => {
  let parsed = null;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return null;
  }

  const envelopes = Array.isArray(parsed) ? parsed : [parsed];
  const records = [];
  let understood = false;

  for (const envelope of envelopes) {
    if (!envelope || typeof envelope !== 'object') continue;
    if (Array.isArray(envelope.result)) {
      understood = true;
      records.push(...envelope.result);
    } else if (Array.isArray(envelope.data)) {
      understood = true;
      records.push(...envelope.data);
    } else if (envelope.sessionId) {
      understood = true;
      records.push(envelope);
    }
  }

  return understood ? records : null;
};

// sessionStart is epoch milliseconds as a string — an absolute instant.
// Never apply a timezone conversion to it.
export const readSessionStartMs = (record) => {
  const numeric = Number(record?.sessionStart);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;

  const created = Date.parse(asTrimmedString(record?.createdAt));
  return Number.isFinite(created) && created > 0 ? created : null;
};

/**
 * Device wall-clock rendering of an epoch-ms instant, for the logs only.
 *
 * sessionStart is an absolute instant, so `Date.now() - sessionStart` is already
 * correct in every timezone — a reading started at 12:30 local unlocks at 12:40
 * local without any conversion. Adding a UTC offset here would skew the window
 * by that offset. This exists so the decision can be read against a wall clock.
 * Hand-rolled rather than toLocaleString, which Hermes builds can stub out.
 */
const toLocalStamp = (ms) => {
  if (!ms) return null;
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

export const readLocalMindAnalysisStamp = async (userId) => {
  try {
    const raw = await AsyncStorage.getItem(MIND_ANALYSIS_LAST_RUN_KEY);
    const trimmed = asTrimmedString(raw);
    // Legacy bare-number stamps carry no userId, so they cannot be attributed.
    if (!trimmed || !trimmed.startsWith('{')) return null;

    const parsed = JSON.parse(trimmed);
    if (asTrimmedString(parsed?.userId) !== asTrimmedString(userId)) return null;

    const at = Number(parsed?.at);
    return Number.isFinite(at) && at > 0 ? at : null;
  } catch {
    return null;
  }
};

/**
 * The gate. Server record first; local mirror only when the GET is unusable.
 *
 *   no record for this user            -> run
 *   sessionStart >= 10 min old         -> run
 *   sessionStart <  10 min old         -> locked
 *   GET unusable (404/network/garbage) -> same rule against the local mirror
 */
export const checkMindAnalysisAccess = async (userId, token) => {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL;
  const now = Date.now();

  const verdictFromTimestamp = (lastRunMs, source) => {
    // Local wall-clock trace: sessionStart, the instant it unlocks, and now.
    const clock = {
      sessionStartLocal: toLocalStamp(lastRunMs),
      enabledAtLocal: toLocalStamp(
        lastRunMs ? lastRunMs + MIND_ANALYSIS_REPEAT_AFTER_MS : null
      ),
      nowLocal: toLocalStamp(now),
    };

    if (!lastRunMs) {
      return { allowed: true, reason: `no record (${source})`, remainingMs: 0, ...clock };
    }
    const elapsed = now - lastRunMs;
    if (elapsed >= MIND_ANALYSIS_REPEAT_AFTER_MS) {
      return { allowed: true, reason: `window elapsed (${source})`, remainingMs: 0, ...clock };
    }
    return {
      allowed: false,
      reason: `within repeat window (${source})`,
      remainingMs: MIND_ANALYSIS_REPEAT_AFTER_MS - elapsed,
      ...clock,
    };
  };

  const fallbackToLocal = async (why) => {
    const lastRunMs = await readLocalMindAnalysisStamp(userId);
    const verdict = verdictFromTimestamp(lastRunMs, 'local');
    console.log('MIND_ANALYSIS_LOCAL_WINDOW:', { why, userId, lastRunMs, ...verdict });
    return verdict;
  };

  if (!userId) {
    return fallbackToLocal('no userId on profile');
  }

  const url = `${base}/get-mindanalysis-access-session?userId=${encodeURIComponent(userId)}`;
  console.log('MIND_ANALYSIS_ACCESS_REQUEST:', { url, token: maskToken(token) });

  let records = null;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        token: token || '',
      },
    });
    // Read as text so an HTML error page or a plain-text n8n error stays visible.
    const rawBody = await res.text();
    console.log('MIND_ANALYSIS_ACCESS_RESPONSE:', {
      status: res.status,
      ok: res.ok,
      body: String(rawBody || '').slice(0, 2000),
    });

    if (!res.ok) {
      return fallbackToLocal(`GET returned ${res.status}`);
    }

    records = parseAccessSessionRecords(rawBody);
    if (records === null) {
      return fallbackToLocal('GET body could not be parsed');
    }
  } catch (e) {
    return fallbackToLocal(`GET threw: ${e?.message || e}`);
  }

  const recordsForUser = [];
  let ignoredRecordsForOtherUser = 0;

  for (const record of records) {
    const recordUserId = asTrimmedString(record?.userId);
    // A record with no userId came back from a userId-filtered query, so it is
    // this user's. A record naming a different user never is.
    if (!recordUserId || recordUserId === asTrimmedString(userId)) {
      recordsForUser.push(record);
    } else {
      ignoredRecordsForOtherUser += 1;
    }
  }

  let latestRunMs = null;
  for (const record of recordsForUser) {
    const startedAt = readSessionStartMs(record);
    if (startedAt && (!latestRunMs || startedAt > latestRunMs)) latestRunMs = startedAt;
  }

  const verdict = verdictFromTimestamp(latestRunMs, 'server');
  console.log('MIND_ANALYSIS_ACCESS:', {
    userId,
    totalRecords: records.length,
    recordsForUser: recordsForUser.length,
    ignoredRecordsForOtherUser,
    latestRunMs,
    ...verdict,
  });

  return verdict;
};

/** Generates the reading. Throws when no usable answer came back. */
export const requestMindAnalysisReading = async (profile, sessionId, language, token) => {
  const payload = buildMindAnalysisPayload(profile, sessionId, language);
  const url = `${process.env.EXPO_PUBLIC_API_BASE_URL}/kundlikonnect/mind-analysis`;

  console.log('MIND_ANALYSIS_REQUEST:', { url, token: maskToken(token) });
  console.log('MIND_ANALYSIS_PAYLOAD:', payload);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      token: token || '',
    },
    body: JSON.stringify(payload),
  });

  const rawBody = await res.text();
  console.log('MIND_ANALYSIS_RESPONSE:', {
    status: res.status,
    ok: res.ok,
    body: String(rawBody || '').slice(0, 2000),
  });

  if (!res.ok) {
    throw new Error(`mind-analysis responded ${res.status}`);
  }

  let parsed = rawBody;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    parsed = rawBody;
  }

  const answer = extractMindAnalysisAnswer(parsed);
  console.log('MIND_ANALYSIS_ANSWER:', { length: answer.length });

  // A 200 carrying no usable string is a failure, not an empty reading.
  if (!answer) {
    throw new Error('mind-analysis returned no usable answer');
  }

  return answer;
};

/**
 * Records that a reading ran. The reading has already succeeded by the time
 * this is called, so nothing here is allowed to fail it.
 */
export const recordMindAnalysisSession = async (sessionId, token, userId) => {
  const url = `${process.env.EXPO_PUBLIC_API_BASE_URL}/create-mindanalysis-access-session`;
  // Two fields only. There is no sessionExpiry: the repeat window is a client
  // policy derived from sessionStart, so storing an expiry would duplicate
  // MIND_ANALYSIS_REPEAT_AFTER_MS in a second place that could disagree.
  const body = {
    sessionId: String(sessionId || ''),
    sessionStart: String(Date.now()),
  };

  console.log('MIND_ANALYSIS_SESSION_REQUEST:', { url, body, token: maskToken(token) });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        token: token || '',
      },
      body: JSON.stringify(body),
    });
    const rawBody = await res.text();
    console.log('MIND_ANALYSIS_SESSION_RESPONSE:', {
      status: res.status,
      ok: res.ok,
      body: String(rawBody || '').slice(0, 1000),
    });

    if (!res.ok) {
      // Known outstanding failure: 404 with
      // "Getting issue while fetching the chat access session."
      // That string lives in the n8n workflow, not in this app, and it says
      // *fetching* on a create endpoint. sessionId is client-generated, so the
      // backend may simply never have seen it. Non-fatal here either way.
      console.warn('MIND_ANALYSIS_SESSION_FAILED:', {
        status: res.status,
        sessionId: body.sessionId,
        note: 'workflow-side error; reading already succeeded',
      });
    }
  } catch (e) {
    console.warn('MIND_ANALYSIS_SESSION_ERROR:', e?.message || e);
  }

  // Stamp the local mirror regardless, so the window still holds if the POST
  // never lands.
  try {
    await AsyncStorage.setItem(
      MIND_ANALYSIS_LAST_RUN_KEY,
      JSON.stringify({ userId: String(userId || ''), at: Date.now() })
    );
    console.log('MIND_ANALYSIS_SESSION_STAMPED:', { userId: String(userId || '') });
  } catch (e) {
    console.warn('MIND_ANALYSIS_SESSION_STAMP_ERROR:', e?.message || e);
  }
};

/**
 * Sends the user's mind-analysis satisfaction (0-100%) to the same
 * `/response-feedback` store the chat thumbs feedback uses, so it shows up in
 * the existing admin feedback flow.
 *
 * The percentage is sent BOTH as a numeric `percentage` field AND embedded in
 * the `feedback` text ("Mind Analysis satisfaction: N%"). `feedback` is already
 * stored + surfaced to admins, so the value is visible with no n8n change; the
 * numeric field is there for when the backend adds a dedicated column.
 * `source: 'mind_analysis'` distinguishes it from chat feedback.
 *
 * Best-effort: returns true on a 2xx, false otherwise. Never throws — the caller
 * decides whether to unlock "Continue to chat" based on the boolean.
 */
export const submitMindAnalysisFeedback = async ({
  sessionId,
  userId,
  percentage,
  reading,
  token,
}) => {
  const url = `${process.env.EXPO_PUBLIC_API_BASE_URL}/response-feedback`;
  const pct = Math.max(0, Math.min(100, Math.round(Number(percentage) || 0)));
  const body = {
    sessionId: asTrimmedString(sessionId),
    userId: asTrimmedString(userId),
    positive: pct >= 50,
    agentResponse: asTrimmedString(reading),
    feedback: `Mind Analysis satisfaction: ${pct}%`,
    percentage: pct,
    source: 'mind_analysis',
  };

  console.log('MIND_ANALYSIS_FEEDBACK_REQUEST:', { url, pct, userId: asTrimmedString(userId) });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { token } : {}),
      },
      body: JSON.stringify(body),
    });
    const rawBody = await res.text();
    console.log('MIND_ANALYSIS_FEEDBACK_RESPONSE:', {
      status: res.status,
      ok: res.ok,
      body: String(rawBody || '').slice(0, 500),
    });
    return res.ok;
  } catch (e) {
    console.warn('MIND_ANALYSIS_FEEDBACK_ERROR:', e?.message || e);
    return false;
  }
};
