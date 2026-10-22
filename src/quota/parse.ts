import type { QuotaWindow } from './model.js'

function record(value: unknown): Record<string, unknown> | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined
  return value as Record<string, unknown>
}

function finite(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/** Unix seconds and milliseconds both show up across backends. */
export function resetsAtMs(value: unknown): number | null {
  const time = finite(value)
  if (time === undefined || time <= 0) return null
  return time < 1e12 ? Math.round(time * 1000) : Math.round(time)
}

/** Keep unknown plan names. A closed enum has already broken Codex itself (`prolite`). */
export function planTypeOf(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text.length > 0 ? text : null
}

/**
 * One `*_window` object from `/wham/usage`:
 * `{ used_percent, limit_window_seconds, reset_after_seconds, reset_at }`.
 * `reset_at` wins; a payload carrying only `reset_after_seconds` is anchored at `now`.
 */
function windowFrom(value: unknown, id: string, now: number): QuotaWindow | undefined {
  const row = record(value)
  if (row === undefined) return undefined
  const usedPercent = finite(row.used_percent)
  if (usedPercent === undefined) return undefined
  const seconds = finite(row.limit_window_seconds)
  const after = finite(row.reset_after_seconds)
  const resetsAt = resetsAtMs(row.reset_at) ?? (after === undefined ? null : now + Math.round(after * 1000))
  return {
    id,
    usedPercent,
    resetsAt,
    windowDurationMins: seconds === undefined ? null : Math.round(seconds / 60),
  }
}

/** Every `*_window` in one `rate_limit` object, in the order the backend lists them. */
function windowsOf(limit: unknown, prefix: string, now: number): QuotaWindow[] {
  const row = record(limit)
  if (row === undefined) return []
  const windows: QuotaWindow[] = []
  for (const [key, value] of Object.entries(row)) {
    if (!key.endsWith('_window')) continue
    const window = windowFrom(value, `${prefix}${key.slice(0, -'_window'.length)}`, now)
    if (window !== undefined) windows.push(window)
  }
  return windows
}

/** A name for one entry of `additional_rate_limits`, which has been both a list and a map. */
function additionalName(entry: Record<string, unknown>, fallback: string): string {
  for (const key of ['limit_name', 'metered_feature', 'name', 'id']) {
    const value = entry[key]
    if (typeof value === 'string' && value.length > 0) return value
  }
  return fallback
}

export interface ParsedQuota {
  planType: string | null
  /** True when the backend says the main limit is exhausted right now. */
  limitReached: boolean
  windows: QuotaWindow[]
}

/**
 * Parse `GET /backend-api/wham/usage`.
 *
 * The main `rate_limit` keeps bare ids (`primary`, `secondary`); code review and any
 * additional metered limit are prefixed, so two limits with a `primary_window` never
 * collide. Anything that is not a window with a `used_percent` is skipped, not zeroed.
 */
export function parseUsage(payload: unknown, now = Date.now()): ParsedQuota {
  const body = record(payload)
  if (body === undefined) return { planType: null, limitReached: false, windows: [] }
  const main = record(body.rate_limit)
  const windows = windowsOf(main, '', now)
  windows.push(...windowsOf(body.code_review_rate_limit, 'code-review:', now))
  const additional = body.additional_rate_limits
  const entries: Array<[string, unknown]> = Array.isArray(additional)
    ? additional.map((entry, index) => [String(index), entry])
    : Object.entries(record(additional) ?? {})
  for (const [fallback, value] of entries) {
    const entry = record(value)
    if (entry === undefined) continue
    const limit = entry.rate_limit ?? entry
    windows.push(...windowsOf(limit, `${additionalName(entry, fallback)}:`, now))
  }
  return {
    planType: planTypeOf(body.plan_type),
    limitReached: main?.limit_reached === true || main?.allowed === false,
    windows,
  }
}
