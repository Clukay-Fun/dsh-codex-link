/**
 * Reading the grant `dsh-llm-pi-ai` already owns.
 *
 * Inference and this card must report the same account, so this plugin stores no token of
 * its own. It reads the record pi-ai's ChatGPT sign-in writes, and only reads it: refresh
 * and rotation stay with pi-ai, which runs them inside the credential store's `modify`.
 *
 * @module dsh-codex-link/grant
 */
/** pi-ai's record address: its own plugin name, then the provider route key. */
export const PI_AI_RECORD_KEY = 'llm-pi-ai/openai-codex';
function record(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value))
        return undefined;
    return value;
}
function text(value) {
    return typeof value === 'string' && value.length > 0 ? value : null;
}
/**
 * The usable grant inside one stored record, or null.
 *
 * A record that is absent, not a grant, or missing the account id reads as "no Codex
 * sign-in" rather than as an error: those are all the same fact to the card.
 */
export function grantOf(stored) {
    if (stored?.kind !== 'grant')
        return null;
    const payload = record(stored.payload);
    if (payload === undefined || payload.type !== 'oauth')
        return null;
    const access = text(payload.access);
    const accountId = text(payload.accountId);
    if (access === null || accountId === null)
        return null;
    const expires = typeof payload.expires === 'number' && Number.isFinite(payload.expires)
        ? payload.expires
        : null;
    return { access, accountId, expires };
}
/** True when pi-ai's own refresh has to run before this token is worth sending. */
export function isExpired(grant, now) {
    return grant.expires !== null && grant.expires <= now;
}
export async function readGrant(credentials) {
    return grantOf(await credentials.readRecord(PI_AI_RECORD_KEY));
}
