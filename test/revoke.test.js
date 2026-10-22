import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clientIdOf, PI_AI_CODEX_CLIENT_ID, REVOKE_URL, revocableOf, revokeGrant } from '../lib/auth/revoke.js'

function jwt(claims) {
  const part = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${part({ alg: 'RS256' })}.${part(claims)}.sig`
}

test('the revocation endpoint is the one auth.openai.com advertises', () => {
  assert.equal(REVOKE_URL, 'https://auth.openai.com/api/accounts/oauth/revoke')
})

test('the refresh token is revoked as the session, against the token’s own client', async () => {
  let seen
  const ok = await revokeGrant({ access: jwt({ client_id: 'app_from_token' }), refresh: 'rt' }, async (url, init) => {
    seen = { url, init }
    return new Response('', { status: 200 })
  })
  assert.equal(ok, true)
  assert.equal(seen.url, REVOKE_URL)
  assert.equal(seen.init.method, 'POST')
  const body = new URLSearchParams(seen.init.body)
  assert.equal(body.get('token'), 'rt')
  assert.equal(body.get('token_type_hint'), 'refresh_token')
  assert.equal(body.get('client_id'), 'app_from_token')
})

test('a token that names no client falls back to pi-ai’s', () => {
  assert.equal(clientIdOf(jwt({ sub: 'u' })), PI_AI_CODEX_CLIENT_ID)
  assert.equal(clientIdOf('opaque'), PI_AI_CODEX_CLIENT_ID)
  assert.equal(clientIdOf(null), PI_AI_CODEX_CLIENT_ID)
})

test('an access-only grant revokes the access token', async () => {
  let body
  await revokeGrant({ access: 'at', refresh: null }, async (_url, init) => {
    body = new URLSearchParams(init.body)
    return new Response('', { status: 200 })
  })
  assert.equal(body.get('token'), 'at')
  assert.equal(body.get('token_type_hint'), 'access_token')
})

test('a refusal or a network failure reports false and never throws', async () => {
  assert.equal(await revokeGrant({ access: 'at', refresh: 'rt' }, async () => new Response('', { status: 400 })), false)
  assert.equal(await revokeGrant({ access: 'at', refresh: 'rt' }, async () => { throw new Error('offline') }), false)
  assert.equal(await revokeGrant({ access: null, refresh: null }, async () => assert.fail('must not call')), false)
})

test('only a pi-ai oauth grant yields something to revoke', () => {
  assert.deepEqual(revocableOf({ kind: 'grant', payload: { type: 'oauth', access: 'a', refresh: 'r' } }), { access: 'a', refresh: 'r' })
  assert.equal(revocableOf(undefined), null)
  assert.equal(revocableOf({ kind: 'api-key' }), null)
  assert.equal(revocableOf({ kind: 'grant', payload: { type: 'api_key', access: 'a' } }), null)
  assert.equal(revocableOf({ kind: 'grant', payload: { type: 'oauth' } }), null)
})
