import assert from 'node:assert/strict'
import { test } from 'node:test'
import { grantOf, isExpired, PI_AI_RECORD_KEY, readGrant } from '../lib/quota/grant.js'

const payload = { type: 'oauth', access: 'at', refresh: 'rt', expires: 2_000, accountId: 'acct_1' }

test('the record address is pi-ai’s own, not this plugin’s', () => {
  assert.equal(PI_AI_RECORD_KEY, 'llm-pi-ai/openai-codex')
})

test('a pi-ai oauth grant is read without inventing fields', () => {
  assert.deepEqual(grantOf({ kind: 'grant', payload }), {
    access: 'at',
    accountId: 'acct_1',
    expires: 2_000,
  })
})

test('anything that is not a usable codex grant reads as no sign-in', () => {
  assert.equal(grantOf(undefined), null)
  assert.equal(grantOf({ kind: 'api-key', key: 'k' }), null)
  assert.equal(grantOf({ kind: 'grant', payload: null }), null)
  assert.equal(grantOf({ kind: 'grant', payload: { type: 'api_key', access: 'at' } }), null)
  assert.equal(grantOf({ kind: 'grant', payload: { ...payload, access: '' } }), null)
  assert.equal(grantOf({ kind: 'grant', payload: { ...payload, accountId: undefined } }), null)
})

test('a grant with no expiry is never called stale', () => {
  const open = grantOf({ kind: 'grant', payload: { ...payload, expires: 'soon' } })
  assert.equal(open.expires, null)
  assert.equal(isExpired(open, Date.now()), false)
  assert.equal(isExpired({ access: 'at', accountId: 'a', expires: 1_000 }, 999), false)
  assert.equal(isExpired({ access: 'at', accountId: 'a', expires: 1_000 }, 1_000), true)
})

test('readGrant asks the store for exactly one key', async () => {
  const asked = []
  const grant = await readGrant({
    readRecord: async (key) => {
      asked.push(key)
      return { kind: 'grant', payload }
    },
  })
  assert.deepEqual(asked, ['llm-pi-ai/openai-codex'])
  assert.equal(grant.accountId, 'acct_1')
})
