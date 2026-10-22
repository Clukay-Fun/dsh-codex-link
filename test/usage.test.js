import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ORIGINATOR, readUsage, USAGE_URL, UsageError } from '../lib/quota/usage.js'
import { QuotaReader } from '../lib/service.js'

const grant = { access: 'at', accountId: 'acct_1', expires: null }

function store(record) {
  return { readRecord: async () => record }
}

function piRecord(overrides = {}) {
  return { kind: 'grant', payload: { type: 'oauth', access: 'at', refresh: 'rt', accountId: 'acct_1', ...overrides } }
}

test('the usage read sends the grant, names the account, and does not pose as the CLI', async () => {
  let seen
  await readUsage(grant, new AbortController().signal, async (url, init) => {
    seen = { url, init }
    return Response.json({ plan_type: 'plus' })
  })
  assert.equal(seen.url, USAGE_URL)
  assert.equal(USAGE_URL, 'https://chatgpt.com/backend-api/wham/usage')
  assert.equal(seen.init.method, 'GET')
  assert.equal(seen.init.headers.authorization, 'Bearer at')
  assert.equal(seen.init.headers['chatgpt-account-id'], 'acct_1')
  assert.equal(seen.init.headers.originator, ORIGINATOR)
  assert.notEqual(seen.init.headers.originator, 'codex_cli_rs')
})

test('a refused token and a throttle are different failures', async () => {
  for (const [status, reason] of [[401, 'auth'], [403, 'auth'], [429, 'rate-limit']]) {
    await assert.rejects(
      readUsage(grant, new AbortController().signal, async () => new Response('', { status })),
      (error) => error instanceof UsageError && error.reason === reason && error.status === status,
    )
  }
})

test('a Cloudflare challenge is not a refused sign-in', async () => {
  let calls = 0
  await assert.rejects(
    readUsage(grant, new AbortController().signal, async () => {
      calls += 1
      return new Response('<html>', { status: 403, headers: { 'cf-mitigated': 'challenge' } })
    }),
    (error) => error instanceof UsageError && error.reason === 'blocked',
  )
  assert.equal(calls, 1, 'a challenge is not retried into')

  const reader = new QuotaReader({
    credentials: store(piRecord()),
    cacheTtlMs: 0,
    fetch: async () => new Response('<html>', { status: 403, headers: { 'cf-mitigated': 'challenge' } }),
  })
  const card = await reader.read(true)
  assert.equal(card.message, 'quota-blocked')
  reader.dispose()
})

test('a 429 is not hammered, a 500 is retried', async () => {
  let throttled = 0
  await assert.rejects(readUsage(grant, new AbortController().signal, async () => {
    throttled += 1
    return new Response('', { status: 429 })
  }))
  assert.equal(throttled, 1)

  let calls = 0
  const quota = await readUsage(grant, new AbortController().signal, async () => {
    calls += 1
    if (calls < 3) return new Response('', { status: 503 })
    return Response.json({ rate_limit: { primary_window: { used_percent: 9 } } })
  })
  assert.equal(calls, 3)
  assert.equal(quota.windows[0]?.usedPercent, 9)
})

test('the card reports windows from the live payload', async () => {
  const reader = new QuotaReader({
    credentials: store(piRecord()),
    cacheTtlMs: 0,
    fetch: async () => Response.json({
      plan_type: 'pro',
      rate_limit: {
        limit_reached: false,
        primary_window: { used_percent: 33, limit_window_seconds: 18000, reset_at: 1_700_000_000 },
      },
    }),
  })
  const card = await reader.read(true)
  assert.equal(card.status, 'logged-in')
  assert.equal(card.planType, 'pro')
  assert.equal(card.windows[0]?.usedPercent, 33)
  assert.equal(card.windows[0]?.windowDurationMins, 300)
  assert.equal(card.limitReached, false)
  assert.equal(JSON.stringify(card).includes('at'), true, 'sanity: card is JSON')
  assert.equal(JSON.stringify(card).includes('"access"'), false, 'the token never reaches the client')
  reader.dispose()
})

test('no pi-ai grant is signed out, and no request is made', async () => {
  let calls = 0
  const reader = new QuotaReader({
    credentials: store(undefined),
    cacheTtlMs: 0,
    fetch: async () => {
      calls += 1
      return Response.json({})
    },
  })
  const card = await reader.read(true)
  assert.equal(card.status, 'logged-out')
  assert.equal(card.message, 'quota-signed-out')
  assert.equal(calls, 0)
  reader.dispose()
})

test('an unrotated token is stale, not rejected, and is never sent', async () => {
  let calls = 0
  const reader = new QuotaReader({
    credentials: store(piRecord({ expires: Date.now() - 1_000 })),
    cacheTtlMs: 0,
    fetch: async () => {
      calls += 1
      return Response.json({})
    },
  })
  const card = await reader.read(true)
  assert.equal(card.status, 'query-failed')
  assert.equal(card.message, 'quota-token-stale')
  assert.equal(calls, 0)
  reader.dispose()
})

test('a refusal keeps the last good windows and marks them stale', async () => {
  let ok = true
  const reader = new QuotaReader({
    credentials: store(piRecord()),
    cacheTtlMs: 0,
    fetch: async () => ok
      ? Response.json({ plan_type: 'plus', rate_limit: { primary_window: { used_percent: 50 } } })
      : new Response('', { status: 401 }),
  })
  const first = await reader.read(true)
  assert.equal(first.status, 'logged-in')
  ok = false
  const second = await reader.read(true)
  assert.equal(second.status, 'query-failed')
  assert.equal(second.message, 'quota-token-rejected')
  assert.equal(second.freshness, 'stale')
  assert.equal(second.windows[0]?.usedPercent, 50)
  assert.equal(second.fetchedAt, first.fetchedAt)
  reader.dispose()
})

test('a fresh cache hit makes no request', async () => {
  let calls = 0
  const reader = new QuotaReader({
    credentials: store(piRecord()),
    cacheTtlMs: 60_000,
    fetch: async () => {
      calls += 1
      return Response.json({ rate_limit: { primary_window: { used_percent: 1 } } })
    },
  })
  await reader.read(true)
  await reader.read(false)
  await reader.read(false)
  assert.equal(calls, 1)
  reader.dispose()
})

test('a forgotten card is read again, so the next account sees its own quota', async () => {
  const plans = ['plus', 'pro']
  let calls = 0
  const reader = new QuotaReader({
    credentials: store(piRecord()),
    fetch: async () => Response.json({ plan_type: plans[calls++], rate_limit: { primary_window: { used_percent: 1 } } }),
  })
  assert.equal((await reader.read()).planType, 'plus')
  assert.equal((await reader.read()).planType, 'plus', 'a fresh card is served from cache')
  reader.forget()
  assert.equal((await reader.read()).planType, 'pro')
  reader.dispose()
})
