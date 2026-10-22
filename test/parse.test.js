import assert from 'node:assert/strict'
import { test } from 'node:test'
import { QuotaCache } from '../lib/quota/cache.js'
import { parseUsage, planTypeOf, resetsAtMs } from '../lib/quota/parse.js'
import { withRetry } from '../lib/protocol/retry.js'

/** The shape `/backend-api/wham/usage` returned for a Plus account, identity fields dropped. */
const PLUS = {
  plan_type: 'plus',
  rate_limit: {
    allowed: true,
    limit_reached: false,
    primary_window: { used_percent: 0, limit_window_seconds: 18000, reset_after_seconds: 17961, reset_at: 1792656319 },
    secondary_window: { used_percent: 7, limit_window_seconds: 604800, reset_after_seconds: 444458, reset_at: 1793082817 },
  },
  code_review_rate_limit: null,
  additional_rate_limits: null,
  credits: { has_credits: false, balance: '0' },
  rate_limit_reached_type: null,
}

test('the live Plus payload yields the 5-hour and weekly windows', () => {
  const parsed = parseUsage(PLUS)
  assert.equal(parsed.planType, 'plus')
  assert.equal(parsed.limitReached, false)
  assert.deepEqual(parsed.windows, [
    { id: 'primary', usedPercent: 0, resetsAt: 1_792_656_319_000, windowDurationMins: 300 },
    { id: 'secondary', usedPercent: 7, resetsAt: 1_793_082_817_000, windowDurationMins: 10080 },
  ])
})

test('the backend’s own exhausted verdict is carried, not inferred', () => {
  assert.equal(parseUsage({ rate_limit: { limit_reached: true } }).limitReached, true)
  assert.equal(parseUsage({ rate_limit: { allowed: false } }).limitReached, true)
  const full = parseUsage({ rate_limit: { allowed: true, primary_window: { used_percent: 100 } } })
  assert.equal(full.limitReached, false, '100% alone is not the backend saying no')
})

test('reset_after_seconds anchors at now when reset_at is absent', () => {
  const parsed = parseUsage({ rate_limit: { primary_window: { used_percent: 3, reset_after_seconds: 60 } } }, 1_000_000)
  assert.equal(parsed.windows[0]?.resetsAt, 1_060_000)
  assert.equal(parsed.windows[0]?.windowDurationMins, null)
})

test('code review and additional limits are prefixed so ids never collide', () => {
  const parsed = parseUsage({
    rate_limit: { primary_window: { used_percent: 1 } },
    code_review_rate_limit: { primary_window: { used_percent: 2 } },
    additional_rate_limits: [
      { limit_name: 'gpt-6-astra', rate_limit: { primary_window: { used_percent: 3 } } },
      { rate_limit: { secondary_window: { used_percent: 4 } } },
    ],
  })
  assert.deepEqual(parsed.windows.map((window) => window.id), [
    'primary',
    'code-review:primary',
    'gpt-6-astra:primary',
    '1:secondary',
  ])
})

test('additional limits keyed as a map parse the same way', () => {
  const parsed = parseUsage({ additional_rate_limits: { spark: { rate_limit: { primary_window: { used_percent: 5 } } } } })
  assert.deepEqual(parsed.windows.map((window) => window.id), ['spark:primary'])
})

test('anything without a used_percent is skipped, not zeroed', () => {
  assert.deepEqual(parseUsage({ rate_limit: { primary_window: { limit_window_seconds: 60 }, note_window: 'x' } }).windows, [])
  assert.deepEqual(parseUsage({}).windows, [])
  assert.deepEqual(parseUsage(null).windows, [])
})

test('planType stays an open string, including prolite', () => {
  assert.equal(planTypeOf('prolite'), 'prolite')
  assert.equal(planTypeOf('something-new'), 'something-new')
  assert.equal(planTypeOf(''), null)
  assert.equal(parseUsage({ plan_type: 'prolite' }).planType, 'prolite')
})

test('resetsAt accepts unix seconds and milliseconds', () => {
  assert.equal(resetsAtMs(1_700_000_000), 1_700_000_000_000)
  assert.equal(resetsAtMs(1_700_000_000_000), 1_700_000_000_000)
  assert.equal(resetsAtMs(0), null)
  assert.equal(resetsAtMs('soon'), null)
})

test('cache reports fresh, then stale, and clears', () => {
  const cache = new QuotaCache(1_000)
  cache.put({ status: 'logged-in', freshness: 'fresh', fetchedAt: 10, planType: null, limitReached: false, windows: [] }, 10)
  assert.equal(cache.get(500)?.freshness, 'fresh')
  assert.equal(cache.get(2_000)?.freshness, 'stale')
  assert.equal(cache.get(2_000)?.card.fetchedAt, 10)
  cache.clear()
  assert.equal(cache.get(2_000), undefined)
})

test('retryable failures back off, the rest surface at once', async () => {
  let calls = 0
  const value = await withRetry(async () => {
    calls += 1
    if (calls < 3) throw new Error('transient')
    return 'ok'
  }, (error) => error instanceof Error && error.message === 'transient')
  assert.equal(value, 'ok')
  assert.equal(calls, 3)

  let once = 0
  await assert.rejects(withRetry(async () => {
    once += 1
    throw new Error('fatal')
  }, (error) => error instanceof Error && error.message === 'transient'))
  assert.equal(once, 1)
})
