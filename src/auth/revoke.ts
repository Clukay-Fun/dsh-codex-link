/**
 * Ending the server-side session on sign-out.
 *
 * Deleting pi-ai's record only forgets the grant locally: the authorization seam has no
 * revocation, so every sign-in left a live session behind and the account's active-session
 * list filled up with unnamed devices. RFC 7009 revocation of the refresh token ends that
 * session, which is what Codex's own CLI does on logout.
 *
 * @module dsh-codex-link/revoke
 */

/** Listed as `revocation_endpoint` in auth.openai.com's OpenID configuration. */
export const REVOKE_URL = 'https://auth.openai.com/api/accounts/oauth/revoke'

/**
 * The client pi-ai signs Codex in as, used only when the token does not name its client.
 * `scripts/check-contract.mjs` fails if the installed pi-ai stops using this id.
 */
export const PI_AI_CODEX_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann'

const REVOKE_TIMEOUT_MS = 10_000

export interface RevocableGrant {
  access: string | null
  refresh: string | null
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

/** The fields revocation needs from pi-ai's opaque payload, or null. */
export function revocableOf(stored: { kind?: string, payload?: unknown } | undefined): RevocableGrant | null {
  if (stored?.kind !== 'grant') return null
  const payload = stored.payload
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) return null
  const row = payload as Record<string, unknown>
  if (row.type !== 'oauth') return null
  const grant = { access: text(row.access), refresh: text(row.refresh) }
  return grant.access === null && grant.refresh === null ? null : grant
}

/** The issuing client, read from the access token so a pi-ai upgrade cannot silently skew it. */
export function clientIdOf(access: string | null): string {
  const part = access?.split('.')[1]
  if (part !== undefined) {
    try {
      const claims = JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>
      const id = text(claims.client_id)
      if (id !== null) return id
    } catch {
      // Not a JWT; fall through.
    }
  }
  return PI_AI_CODEX_CLIENT_ID
}

/**
 * Revoke one grant. The refresh token is the session, so it goes first; an access-only
 * grant revokes what it has. Returns whether the issuer accepted it. RFC 7009 answers 200
 * for a token it no longer knows, so "already gone" also reads as success.
 */
export async function revokeGrant(grant: RevocableGrant, http: typeof fetch = globalThis.fetch): Promise<boolean> {
  const token = grant.refresh ?? grant.access
  if (token === null) return false
  const body = new URLSearchParams({
    token,
    token_type_hint: grant.refresh !== null ? 'refresh_token' : 'access_token',
    client_id: clientIdOf(grant.access),
  })
  try {
    const response = await http(REVOKE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
      body,
      signal: AbortSignal.timeout(REVOKE_TIMEOUT_MS),
    })
    return response.ok
  } catch {
    return false
  }
}
