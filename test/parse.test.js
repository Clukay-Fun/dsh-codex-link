import assert from 'node:assert/strict'
import { test } from 'node:test'
import { QuotaCache } from '../lib/quota/cache.js'
import { parseAccount, parseRateLimits, planTypeOf, resetsAtMs } from '../lib/quota/parse.js'
import { OVERLOADED, RpcError } from '../lib/protocol/ndjson.js'
import { withOverloadRetry } from '../lib/protocol/retry.js'

test('account/read with no account is logged out', () => {
  assert.deepEqual(parseAccount({ account: null, requiresOpenaiAuth: true }), {
    loggedIn: false,
    planType: null,
    email: null,
  })
})

test('planType stays an open string, including prolite', () => {
  assert.equal(planTypeOf('prolite'), 'prolite')
  assert.equal(planTypeOf('something-new'), 'something-new')
  assert.equal(planTypeOf(''), null)
  const account = parseAccount({
    account: { type: 'chatgpt', email: 'a@example.com', planType: 'prolite' },
    requiresOpenaiAuth: false,
  })
  assert.equal(account.loggedIn, true)
  assert.equal(account.planType, 'prolite')
})

test('a missing primary window still yields the weekly window', () => {
  const parsed = parseRateLimits({
    rateLimits: {
      planType: 'plus',
      primary: null,
      secondary: { usedPercent: 12.5, windowDurationMins: 10080, resetsAt: 1_700_000_000 },
      extra: { note: 'not a window' },
    },
  })
  assert.equal(parsed.planType, 'plus')
  assert.deepEqual(parsed.windows.map((window) => window.id), ['secondary'])
  assert.equal(parsed.windows[0]?.usedPercent, 12.5)
  assert.equal(parsed.windows[0]?.resetsAt, 1_700_000_000_000)
})

test('window lists and per-limit snapshots are flattened without dropping unknown ids', () => {
  const parsed = parseRateLimits({
    rateLimits: {
      windows: [{ id: 'weekly', usedPercent: 3, resetsAt: null, windowDurationMins: null }],
    },
    rateLimitsByLimitId: {
      codex: { primary: { usedPercent: 9, resetsAt: 1_800_000_000_000, windowDurationMins: 300 } },
    },
  })
  assert.deepEqual(parsed.windows.map((window) => [window.id, window.usedPercent]), [
    ['weekly', 3],
    ['codex:primary', 9],
  ])
})

test('resetsAt accepts unix seconds and milliseconds', () => {
  assert.equal(resetsAtMs(1_700_000_000), 1_700_000_000_000)
  assert.equal(resetsAtMs(1_700_000_000_000), 1_700_000_000_000)
  assert.equal(resetsAtMs(null), null)
})

test('cache reports fresh, then stale, and clears', () => {
  const cache = new QuotaCache(1_000)
  const card = {
    status: 'logged-in',
    freshness: 'fresh',
    fetchedAt: 10,
    planType: 'plus',
    email: null,
    windows: [],
  }
  cache.put(card, 10)
  assert.equal(cache.get(20)?.freshness, 'fresh')
  assert.equal(cache.get(2_000)?.freshness, 'stale')
  assert.equal(cache.get(2_000)?.card.fetchedAt, 10)
  cache.clear()
  assert.equal(cache.get(2_000), undefined)
})

test('overloaded requests retry, other errors do not', async () => {
  let calls = 0
  const value = await withOverloadRetry(async () => {
    calls += 1
    if (calls < 3) throw new RpcError('server overloaded', OVERLOADED, null)
    return 'ok'
  })
  assert.equal(value, 'ok')
  assert.equal(calls, 3)

  let once = 0
  await assert.rejects(withOverloadRetry(async () => {
    once += 1
    throw new RpcError('nope', -32603, null)
  }))
  assert.equal(once, 1)
})
