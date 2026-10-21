/** One quota window. The UI renders this list and never assumes two fixed slots. */
export interface QuotaWindow {
  id: string
  usedPercent: number
  resetsAt: number | null
  windowDurationMins: number | null
}

export interface LoggedInCard {
  status: 'logged-in'
  freshness: 'fresh' | 'stale'
  fetchedAt: number
  planType: string | null
  email: string | null
  windows: QuotaWindow[]
}

export interface QueryFailedCard {
  status: 'query-failed'
  freshness: 'stale' | 'empty'
  fetchedAt: number | null
  message: string
  planType: string | null
  windows: QuotaWindow[]
}

export interface LoggedOutCard {
  status: 'logged-out'
  freshness: 'empty'
  fetchedAt: null
  message: string
  planType: null
  windows: []
}

export type QuotaCard = LoggedInCard | QueryFailedCard | LoggedOutCard

export const ACCOUNT_READ_TIMEOUT_MS = 25_000
export const RATE_LIMIT_TIMEOUT_MS = 15_000
export const SESSION_TIMEOUT_MS = 60_000
export const DEFAULT_CACHE_TTL_MS = 60_000
