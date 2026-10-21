import type { QuotaWindow } from './model.js'

const SNAPSHOT_KEYS = new Set([
  'limitId',
  'limitName',
  'normalModelSlug',
  'primary',
  'secondary',
  'credits',
  'individualLimit',
  'spendControlReached',
  'planType',
  'rateLimitReachedType',
])

function record(value: unknown): Record<string, unknown> | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined
  return value as Record<string, unknown>
}

function finite(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/** Unix seconds and milliseconds both show up across Codex versions. */
export function resetsAtMs(value: unknown): number | null {
  const time = finite(value)
  if (time === undefined || time <= 0) return null
  return time < 1e12 ? Math.round(time * 1000) : Math.round(time)
}

function windowFrom(value: unknown, id: string): QuotaWindow | undefined {
  const row = record(value)
  if (row === undefined) return undefined
  const usedPercent = finite(row.usedPercent)
  if (usedPercent === undefined) return undefined
  const duration = finite(row.windowDurationMins)
  return {
    id,
    usedPercent,
    resetsAt: resetsAtMs(row.resetsAt),
    windowDurationMins: duration === undefined ? null : duration,
  }
}

function pushWindow(windows: QuotaWindow[], seen: Set<string>, value: unknown, id: string): void {
  if (seen.has(id)) return
  const window = windowFrom(value, id)
  if (window === undefined) return
  seen.add(id)
  windows.push(window)
}

function windowsFromSnapshot(snapshot: Record<string, unknown>, prefix: string): QuotaWindow[] {
  const windows: QuotaWindow[] = []
  const seen = new Set<string>()
  const list = snapshot.windows
  if (Array.isArray(list)) {
    list.forEach((item, index) => {
      const row = record(item)
      const id = typeof row?.id === 'string' && row.id.length > 0
        ? `${prefix}${row.id}`
        : `${prefix}${index}`
      pushWindow(windows, seen, item, id)
    })
  }
  pushWindow(windows, seen, snapshot.primary, `${prefix}primary`)
  pushWindow(windows, seen, snapshot.secondary, `${prefix}secondary`)
  for (const [key, value] of Object.entries(snapshot)) {
    if (SNAPSHOT_KEYS.has(key) || key === 'windows') continue
    pushWindow(windows, seen, value, `${prefix}${key}`)
  }
  return windows
}

/** Keep unknown plan names. A closed enum has already broken Codex itself (`prolite`). */
export function planTypeOf(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text.length > 0 ? text : null
}

export interface ParsedQuota {
  planType: string | null
  windows: QuotaWindow[]
}

/** Accept the historical snapshot and the per-limit map. Unknown windows are skipped. */
export function parseRateLimits(payload: unknown): ParsedQuota {
  const body = record(payload)
  if (body === undefined) return { planType: null, windows: [] }
  const windows: QuotaWindow[] = []
  const seen = new Set<string>()
  const take = (parsed: QuotaWindow[]) => {
    for (const window of parsed) {
      if (seen.has(window.id)) continue
      seen.add(window.id)
      windows.push(window)
    }
  }
  const snapshot = record(body.rateLimits)
  let planType = planTypeOf(snapshot?.planType)
  if (snapshot !== undefined) take(windowsFromSnapshot(snapshot, ''))
  const byLimit = record(body.rateLimitsByLimitId)
  if (byLimit !== undefined) {
    for (const [limitId, value] of Object.entries(byLimit)) {
      const nested = record(value)
      if (nested === undefined) continue
      planType ??= planTypeOf(nested.planType)
      take(windowsFromSnapshot(nested, `${limitId}:`))
    }
  }
  return { planType, windows }
}

export interface ParsedAccount {
  loggedIn: boolean
  planType: string | null
  email: string | null
}

export function parseAccount(payload: unknown): ParsedAccount {
  const body = record(payload)
  const account = record(body?.account)
  if (account === undefined) return { loggedIn: false, planType: null, email: null }
  const email = typeof account.email === 'string' && account.email.length > 0 ? account.email : null
  return {
    loggedIn: true,
    planType: planTypeOf(account.planType),
    email,
  }
}
