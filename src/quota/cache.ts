import type { LoggedInCard } from './model.js'

export interface CacheHit {
  freshness: 'fresh' | 'stale'
  card: LoggedInCard
}

/** In-memory snapshot. Nothing is written to disk, so uninstall leaves no quota file. */
export class QuotaCache {
  private entry: { at: number, card: LoggedInCard } | undefined

  constructor(private readonly ttlMs: number) {}

  put(card: LoggedInCard, now: number): void {
    this.entry = { at: now, card }
  }

  clear(): void {
    this.entry = undefined
  }

  get(now: number): CacheHit | undefined {
    if (this.entry === undefined) return undefined
    const freshness = now - this.entry.at <= this.ttlMs ? 'fresh' : 'stale'
    return {
      freshness,
      card: { ...this.entry.card, freshness, windows: this.entry.card.windows.slice() },
    }
  }
}
