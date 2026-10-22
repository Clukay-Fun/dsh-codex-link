import { QuotaCache } from './quota/cache.js'
import { isExpired, readGrant, type CredentialReader, type PiAiGrant } from './quota/grant.js'
import {
  DEFAULT_CACHE_TTL_MS,
  type LoggedOutCard,
  type QueryFailedCard,
  type QuotaCard,
} from './quota/model.js'
import { readUsage, UsageError } from './quota/usage.js'

export interface ReaderOptions {
  credentials: CredentialReader
  cacheTtlMs?: number
  fetch?: typeof fetch
}

/** Message codes the client turns into copy. The host ships no prose to the UI. */
const SIGNED_OUT = 'quota-signed-out'
const TOKEN_STALE = 'quota-token-stale'
const TOKEN_REJECTED = 'quota-token-rejected'
const THROTTLED = 'quota-throttled'
const BLOCKED = 'quota-blocked'
const UNAVAILABLE = 'quota-unavailable'
const STOPPED = 'quota-stopped'

function signedOut(): LoggedOutCard {
  return {
    status: 'logged-out',
    freshness: 'empty',
    fetchedAt: null,
    message: SIGNED_OUT,
    planType: null,
    windows: [],
  }
}

function failed(message: string, stale: ReturnType<QuotaCache['get']>): QueryFailedCard {
  if (stale === undefined) {
    return {
      status: 'query-failed',
      freshness: 'empty',
      fetchedAt: null,
      message,
      planType: null,
      windows: [],
    }
  }
  return {
    status: 'query-failed',
    freshness: 'stale',
    fetchedAt: stale.card.fetchedAt,
    message,
    planType: stale.card.planType,
    windows: stale.card.windows,
  }
}

function messageFor(error: unknown): string {
  if (!(error instanceof UsageError)) return UNAVAILABLE
  if (error.reason === 'auth') return TOKEN_REJECTED
  if (error.reason === 'rate-limit') return THROTTLED
  if (error.reason === 'blocked') return BLOCKED
  return UNAVAILABLE
}

/**
 * Serial usage reads against the Codex grant `dsh-llm-pi-ai` owns.
 *
 * Nothing here holds a token. An absent grant is simply "not signed in", and a token pi-ai
 * has not rotated yet is reported stale rather than sent, because an expired token would
 * come back as a rejected sign-in and read like a different fault. A fresh cache hit makes
 * no request, so reopening settings does not hit the backend each time.
 */
export class QuotaReader {
  private readonly cache: QuotaCache
  private tail: Promise<unknown> = Promise.resolve()
  private disposed = false
  private active: AbortController | undefined

  constructor(private readonly options: ReaderOptions) {
    const ttl = options.cacheTtlMs
    this.cache = new QuotaCache(ttl !== undefined && Number.isFinite(ttl) && ttl >= 0 ? ttl : DEFAULT_CACHE_TTL_MS)
  }

  read(refresh = false): Promise<QuotaCard> {
    const job = this.tail.then(() => this.load(refresh))
    this.tail = job.then(() => undefined, () => undefined)
    return job
  }

  dispose(): void {
    this.disposed = true
    this.active?.abort()
  }

  private async load(refresh: boolean): Promise<QuotaCard> {
    if (this.disposed) return failed(STOPPED, undefined)
    if (!refresh) {
      const hit = this.cache.get(Date.now())
      if (hit?.freshness === 'fresh') return hit.card
    }
    let grant: PiAiGrant | null
    try {
      grant = await readGrant(this.options.credentials)
    } catch {
      return failed(UNAVAILABLE, this.cache.get(Date.now()))
    }
    if (grant === null) {
      this.cache.clear()
      return signedOut()
    }
    if (isExpired(grant, Date.now())) return failed(TOKEN_STALE, this.cache.get(Date.now()))
    if (this.disposed) return failed(STOPPED, undefined)
    this.active = new AbortController()
    try {
      const quota = await readUsage(grant, this.active.signal, this.options.fetch)
      const card = {
        status: 'logged-in' as const,
        freshness: 'fresh' as const,
        fetchedAt: Date.now(),
        planType: quota.planType,
        limitReached: quota.limitReached,
        windows: quota.windows,
      }
      this.cache.put(card, card.fetchedAt)
      return card
    } catch (error) {
      return failed(messageFor(error), this.cache.get(Date.now()))
    } finally {
      this.active = undefined
    }
  }
}
