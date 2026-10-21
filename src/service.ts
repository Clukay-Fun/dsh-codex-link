import { QuotaCache } from './quota/cache.js'
import {
  DEFAULT_CACHE_TTL_MS,
  SESSION_TIMEOUT_MS,
  type QueryFailedCard,
  type QuotaCard,
} from './quota/model.js'
import { readQuotaOnce } from './quota/session.js'

export interface ReaderOptions {
  executable: string
  cacheTtlMs?: number
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

/** Serial one-shot reads. A fresh cache hit does not start a process. */
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
    if (this.disposed) return failed('额度查询已停止', undefined)
    const now = Date.now()
    if (!refresh) {
      const hit = this.cache.get(now)
      if (hit?.freshness === 'fresh') return hit.card
    }
    const signal = AbortSignal.timeout(SESSION_TIMEOUT_MS)
    this.active = new AbortController()
    const linked = AbortSignal.any([signal, this.active.signal])
    try {
      const { card } = await readQuotaOnce(this.options.executable, linked, Date.now())
      if (card.status === 'logged-out') this.cache.clear()
      if (card.status === 'logged-in') this.cache.put(card, card.fetchedAt)
      return card
    } catch (error) {
      const message = error instanceof Error ? error.message : '额度查询失败'
      return failed(message, this.cache.get(Date.now()))
    } finally {
      this.active = undefined
    }
  }
}
