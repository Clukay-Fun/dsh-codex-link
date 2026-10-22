import { withRetry } from '../protocol/retry.js'
import type { PiAiGrant } from './grant.js'
import { USAGE_TIMEOUT_MS } from './model.js'
import { parseUsage, type ParsedQuota } from './parse.js'

/**
 * The endpoint behind Codex's own `account/rateLimits/read`. No local CLI is involved.
 *
 * Under `chatgpt.com/backend-api` the Codex backend lives at `/wham/*`. The `/codex/usage`
 * spelling belongs to the `/api/codex/*` base and, sent here, is answered by a Cloudflare
 * challenge rather than by the backend — which looks like a refused token and is not one.
 */
export const USAGE_URL = 'https://chatgpt.com/backend-api/wham/usage'

/**
 * How this plugin names itself to the backend. pi-ai sends `pi`; neither of us claims to
 * be the Codex CLI, because the header is an attribution field, not a capability.
 */
export const ORIGINATOR = 'dsh-codex-link'

export type UsageFailure = 'auth' | 'blocked' | 'rate-limit' | 'server' | 'network' | 'payload'

export class UsageError extends Error {
  constructor(readonly reason: UsageFailure, readonly status: number | null) {
    super(reason)
    this.name = 'UsageError'
  }
}

function reasonOf(response: Response): UsageFailure {
  // A Cloudflare challenge also answers 403, but it is about the request, not the token.
  // Calling it a refused sign-in would send the person to sign in again for nothing.
  if (response.headers.get('cf-mitigated') !== null) return 'blocked'
  const status = response.status
  if (status === 401 || status === 403) return 'auth'
  if (status === 429) return 'rate-limit'
  return 'server'
}

function retryable(error: unknown): boolean {
  if (!(error instanceof UsageError)) return false
  return error.reason === 'server' || error.reason === 'network'
}

async function once(grant: PiAiGrant, signal: AbortSignal, http: typeof fetch): Promise<ParsedQuota> {
  let response: Response
  try {
    response = await http(USAGE_URL, {
      method: 'GET',
      signal,
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${grant.access}`,
        'chatgpt-account-id': grant.accountId,
        originator: ORIGINATOR,
      },
    })
  } catch (error) {
    if (signal.aborted) throw error
    throw new UsageError('network', null)
  }
  if (!response.ok) throw new UsageError(reasonOf(response), response.status)
  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new UsageError('payload', response.status)
  }
  return parseUsage(body)
}

/**
 * One usage read. A 429 is not retried: this call exists to report a quota, and hammering
 * the endpoint that just rate-limited us would be the one request worth not repeating.
 */
export async function readUsage(
  grant: PiAiGrant,
  signal: AbortSignal,
  http: typeof fetch = globalThis.fetch,
): Promise<ParsedQuota> {
  const timed = AbortSignal.any([signal, AbortSignal.timeout(USAGE_TIMEOUT_MS)])
  return withRetry(() => once(grant, timed, http), retryable, timed)
}
