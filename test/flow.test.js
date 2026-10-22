import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CodexLogin } from '../lib/auth/flow.js'

const KEY = 'llm-pi-ai/openai-codex'

/** A stand-in for the seam: records what was asked and lets a test drive one attempt. */
function harness({ configured = false, methods = ['oauth', 'api_key'], openBrowser } = {}) {
  const state = { configured, cancelled: 0, deleted: 0, begun: [], interaction: null, opened: [] }
  let settle
  const authorization = {
    describe: (key) => key === KEY
      ? { key, label: 'OpenAI (ChatGPT Plus/Pro)', methods: methods.map((id) => ({ id })), inFlight: state.interaction !== null }
      : undefined,
    cancel: (key) => {
      assert.equal(key, KEY)
      state.cancelled += 1
    },
    begin: (request) => {
      state.begun.push(request.method)
      state.interaction = request.interaction
      return new Promise((resolve, reject) => {
        settle = { resolve, reject }
      })
    },
  }
  const credentials = {
    describeRecord: async (key) => {
      assert.equal(key, KEY)
      return { configured: state.configured }
    },
    deleteRecord: async () => {
      state.deleted += 1
      state.configured = false
    },
  }
  return {
    state,
    login: new CodexLogin({
      authorization,
      credentials,
      openBrowser: openBrowser ?? (async (url) => {
        state.opened.push(url)
      }),
    }),
    finish: (status) => {
      state.interaction = null
      settle.resolve({ status })
    },
    fail: (error) => {
      state.interaction = null
      settle.reject(error)
    },
  }
}

const tick = () => new Promise((resolve) => setImmediate(resolve))

test('a stored grant reads as signed in without starting anything', async () => {
  const { login, state } = harness({ configured: true })
  const view = await login.status()
  assert.equal(view.status, 'signed-in')
  assert.equal(view.label, 'OpenAI (ChatGPT Plus/Pro)')
  assert.deepEqual(view.methods, ['oauth', 'api_key'])
  assert.deepEqual(state.begun, [])
})

test('sign-in drives pi-ai’s flow and returns before the browser does', async () => {
  const { login, state, finish } = harness()
  const view = await login.start()
  assert.equal(view.status, 'pending')
  assert.deepEqual(state.begun, [undefined], 'no method named means the flow’s first one')
  state.configured = true
  finish('authorized')
  await tick()
  assert.equal((await login.status()).status, 'signed-in')
})

test('a notice reaches the surface, with its page and code', async () => {
  const { login, state, finish } = harness()
  await login.start('oauth')
  state.interaction.notify({ message: 'Open this page', url: 'https://auth.openai.com/x', code: 'ABCD' })
  const view = await login.status()
  assert.equal(view.notice.message, 'Open this page')
  assert.equal(view.notice.url, 'https://auth.openai.com/x')
  assert.equal(view.notice.code, 'ABCD')
  finish('cancelled')
  await tick()
  assert.equal((await login.status()).notice, null, 'a settled attempt shows no notice')
})

test('a question is held for the surface and answered by id', async () => {
  const { login, state, finish } = harness()
  await login.start()
  const asked = state.interaction.prompt({
    kind: 'select',
    message: 'Pick a method',
    options: [{ id: 'browser', label: 'Browser' }, { id: 'device_code', label: 'Device code' }],
  })
  const view = await login.status()
  assert.equal(view.prompt.kind, 'select')
  assert.equal(view.prompt.message, 'Pick a method')
  assert.equal(view.prompt.options.length, 2)

  await login.answer(view.prompt.id + 99, 'device_code')
  assert.notEqual((await login.status()).prompt, null, 'a stale id answers nothing')

  await login.answer(view.prompt.id, 'browser')
  assert.equal(await asked, 'browser')
  assert.equal((await login.status()).prompt, null)
  finish('authorized')
  await tick()
})

test('a withdrawn question stops waiting, so the attempt can finish', async () => {
  const { login, state, finish } = harness()
  await login.start()
  const controller = new AbortController()
  const asked = state.interaction.prompt({
    kind: 'text',
    message: 'Paste the redirect URL',
    placeholder: 'http://127.0.0.1:1455/auth/callback',
    signal: controller.signal,
  })
  assert.equal((await login.status()).prompt.placeholder, 'http://127.0.0.1:1455/auth/callback')
  controller.abort()
  await assert.rejects(asked)
  assert.equal((await login.status()).prompt, null)
  finish('authorized')
  await tick()
})

test('cancel withdraws the attempt through the seam', async () => {
  const { login, state, finish } = harness()
  await login.start()
  const view = await login.cancel()
  assert.equal(state.cancelled, 1)
  assert.equal(view.status, 'pending', 'the seam decides when the attempt is really over')
  finish('cancelled')
  await tick()
  assert.equal((await login.status()).status, 'cancelled')
})

test('a flow failure is reported by its seam code, not as a signed-out state', async () => {
  const { login, fail } = harness()
  await login.start()
  const error = new Error('nope')
  error.code = 'NOT_COMMITTED'
  fail(error)
  await tick()
  const view = await login.status()
  assert.equal(view.status, 'failed')
  assert.equal(view.code, 'NOT_COMMITTED')
})

test('no registered flow is a named failure, and nothing is begun', async () => {
  const login = new CodexLogin({
    authorization: { describe: () => undefined, cancel: () => {}, begin: () => assert.fail('must not begin') },
    credentials: { describeRecord: async () => ({ configured: false }), deleteRecord: async () => {} },
    openBrowser: async () => assert.fail('must not open'),
  })
  const view = await login.start()
  assert.equal(view.status, 'failed')
  assert.equal(view.code, 'NO_FLOW')
})

test('a second sign-in does not start beside the first', async () => {
  const { login, state, finish } = harness()
  await login.start()
  await login.start()
  assert.equal(state.begun.length, 1)
  finish('cancelled')
  await tick()
})

test('signing out deletes pi-ai’s record and holds no token of its own', async () => {
  const { login, state } = harness({ configured: true })
  const view = await login.logout()
  assert.equal(state.deleted, 1)
  assert.equal(view.status, 'signed-out')
})

test('the view never carries a token', async () => {
  const { login, state, finish } = harness()
  await login.start()
  state.interaction.notify({ message: 'Open this page', url: 'https://auth.openai.com/x' })
  const text = JSON.stringify(await login.status())
  for (const leak of ['access', 'refresh', 'Bearer', 'eyJ']) {
    assert.equal(text.includes(leak), false, `view leaks ${leak}`)
  }
  finish('cancelled')
  await tick()
})

test('the announced sign-in page opens in the system browser, once', async () => {
  const { login, state, finish } = harness()
  await login.start()
  const url = 'https://auth.openai.com/oauth/authorize?client_id=app_x&originator=pi'
  state.interaction.notify({ message: 'A browser window should open.', url })
  state.interaction.notify({ message: 'still waiting', url })
  assert.deepEqual(state.opened, [url])
  assert.equal((await login.status()).notice.url, url, 'the link stays on screen as the fallback')
  finish('cancelled')
  await tick()
})

test('only an https page is handed to the opener', async () => {
  const { login, state, finish } = harness()
  await login.start()
  for (const url of ['file:///etc/passwd', 'javascript:alert(1)', 'http://localhost:1455/x', 'not a url']) {
    state.interaction.notify({ message: 'x', url })
  }
  state.interaction.notify({ message: 'no page' })
  assert.deepEqual(state.opened, [])
  finish('cancelled')
  await tick()
})

test('a browser that will not open leaves the link and does not fail the attempt', async () => {
  const { login, state, finish } = harness({ openBrowser: async () => { throw new Error('no browser') } })
  await login.start()
  state.interaction.notify({ message: 'open', url: 'https://auth.openai.com/x' })
  await tick()
  const view = await login.status()
  assert.equal(view.status, 'pending')
  assert.equal(view.notice.url, 'https://auth.openai.com/x')
  finish('cancelled')
  await tick()
})

test('a new attempt may open the same page again', async () => {
  const { login, state, finish } = harness()
  const url = 'https://auth.openai.com/x'
  await login.start()
  state.interaction.notify({ message: 'open', url })
  finish('cancelled')
  await tick()
  await login.start()
  state.interaction.notify({ message: 'open', url })
  assert.deepEqual(state.opened, [url, url])
  finish('cancelled')
  await tick()
})
