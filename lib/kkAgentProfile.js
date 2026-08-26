// lib/kkAgentProfile.js
//
// Creates (or reuses — the backend is idempotent on owner+fields+kind) a
// kk-agent birth profile for the signed-in user, and returns its
// `profile_id`. This is what chat.js sends as `params.profile_id` to the
// new kk-agent chat webhook so the agent can read birth-chart data
// (dob/tob/pob never leave kk-agent's own boundary — see ADR 0003).
//
// ============================================================================
// AUTH
// ============================================================================
// kk-agent's POST /v1/birth_profiles authenticates the caller as an Actor.
// The deployed server accepts the `X-Actor-Id` header (keycloak_required is
// off there — verified 2026-08-25), so this call works in production as-is.
//
// The actor id comes from EXPO_PUBLIC_KK_AGENT_DEV_ACTOR_ID and is a single
// shared actor for all app users. The cleaner long-term path is Option B:
// create the profile server-side in our own backend and have the app read
// `kkAgentProfileId` from the /user-info response, instead of calling
// kk-agent directly here.
// ============================================================================

const AGENT_NAME = 'vedic-astrologer';
const REQUIRED_CONSENT_KEY = 'birth_data_storage';

/**
 * @param {object} profile - the app's USER_PROFILE shape:
 *   { day, month, year, hour, min, city, state, country, ... }
 * @returns {Promise<string>} the kk-agent profile_id
 * @throws if the call fails (caller should treat this as best-effort —
 *   chat still works without a profile_id, just without birth-chart context)
 */
export async function createOrGetKkAgentProfile(profile) {
  const base = process.env.EXPO_PUBLIC_KK_AGENT_BASE_URL;
  // Shared actor id for the hosted kk-agent (see AUTH note above), e.g.:
  //   EXPO_PUBLIC_KK_AGENT_DEV_ACTOR_ID=55555555-aaaa-4000-8000-000000000001
  const actorId = process.env.EXPO_PUBLIC_KK_AGENT_DEV_ACTOR_ID;

  if (!base) {
    throw new Error('EXPO_PUBLIC_KK_AGENT_BASE_URL is not set');
  }

  const dob = `${String(profile.day).padStart(2, '0')}-${String(profile.month).padStart(2, '0')}-${profile.year}`;
  const tob =
    profile.hour != null && profile.min != null
      ? `${String(profile.hour).padStart(2, '0')}:${String(profile.min).padStart(2, '0')}`
      : null;
  const pob = [profile.city, profile.state, profile.country || 'India']
    .filter(Boolean)
    .join(', ');

  const res = await fetch(`${base}/v1/birth_profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Hosted kk-agent authenticates birth_profiles via X-Actor-Id.
      ...(actorId ? { 'X-Actor-Id': actorId } : {}),
    },
    body: JSON.stringify({
      consent: {
        consents_to: [REQUIRED_CONSENT_KEY],
        method: 'checkbox_click',
        authorized_agents: [AGENT_NAME],
      },
      profile_kind: 'self',
      fields: { dob, tob, pob },
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (json && (json.detail?.message || json.detail)) || 'Failed to create kk-agent birth profile';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return json.profile_id;
}