// lib/kkAgentProfile.js
//
// Creates (or reuses — the backend is idempotent on owner+fields+kind) a
// kk-agent birth profile for the signed-in user, and returns its
// `profile_id`. This is what chat.js sends as `params.profile_id` to the
// new kk-agent chat webhook so the agent can read birth-chart data
// (dob/tob/pob never leave kk-agent's own boundary — see ADR 0003).
//
// ============================================================================
// AUTH — LOCAL DEV ONLY, NOT PRODUCTION-READY
// ============================================================================
// kk-agent's POST /v1/birth_profiles only accepts:
//   1. Authorization: Bearer <Keycloak-issued token>, or
//   2. X-Actor-Id / X-Dev-Actor-Id (dev/test environments only)
//
// This app's AUTH_TOKEN comes from our own Node/Mongo backend, NOT
// Keycloak. The X-Dev-Actor-Id header below is a LOCAL DEV SHIM ONLY —
// it will 401 the moment kk-agent's APP_ENV != development/test, or
// keycloak_required=true (i.e. any real deployment).
//
// DO NOT ship this file as-is to production. Before shipping, resolve
// Open Item #1 in the handoff doc (Handoff_kk-agent_Webhook_Migration_v2.md):
// either (a) get a real Keycloak bearer token flow for the app, or
// (b) move this call server-side into our own backend (Option B) and
// have chat.js just read profile_id from /update-profile's response
// instead of calling kk-agent directly at all.
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
  // LOCAL DEV SHIM — see header comment. Set this in .env.local to the
  // platform_admin (or any human) actor_id you're testing as, e.g.:
  //   EXPO_PUBLIC_KK_AGENT_DEV_ACTOR_ID=55555555-aaaa-4000-8000-000000000001
  const devActorId = process.env.EXPO_PUBLIC_KK_AGENT_DEV_ACTOR_ID;

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
      // (X-Dev-Actor-Id is only honored in local dev/test envs and is
      // rejected on the deployed server — verified 2026-08-25.)
      ...(devActorId ? { 'X-Actor-Id': devActorId } : {}),
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