import { CodexLogin } from './lib/auth/flow.js'
import { QuotaReader } from './lib/service.js'

export const name = 'dsh-codex-link'
export const inject = ['connection', 'credentials', 'authorization']

const QUOTA_PATH = '/api/codex-quota'
const AUTH_PATH = '/api/codex-auth'

const JSON_HEADERS = { 'cache-control': 'no-store' }

function unavailable() {
  return {
    status: 'query-failed',
    freshness: 'empty',
    fetchedAt: null,
    message: 'quota-unavailable',
    planType: null,
    windows: [],
  }
}

function authFailure(code) {
  return { status: 'failed', label: null, methods: [], notice: null, prompt: null, code, revoked: null }
}

/**
 * Host half: the Codex sign-in entry and the usage card.
 *
 * This plugin registers no model provider and holds no token. `dsh-llm-pi-ai` ships with the
 * harness, serves the `openai-codex` route and owns the OAuth protocol; what it lacks is a
 * surface that starts its sign-in, because the models settings page renders nothing for a
 * keyless OAuth-only provider. Both halves here read and drive that one grant, so the
 * percentages always describe the account that answers prompts.
 */
export function apply(ctx, config = {}) {
  const login = new CodexLogin({
    authorization: ctx.authorization,
    credentials: ctx.credentials,
    logger: ctx.logger,
  })
  const reader = new QuotaReader({
    credentials: ctx.credentials,
    cacheTtlMs: config.cacheTtlMs,
  })
  ctx.effect(() => () => {
    reader.dispose()
    login.dispose()
  }, 'dsh-codex-link: stop')

  ctx.connection.fetch.register({
    path: AUTH_PATH,
    methods: ['GET', 'POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      try {
        if (request.method === 'GET') return Response.json(await login.status(), { headers: JSON_HEADERS })
        const text = await request.text()
        const body = text.length > 0 ? JSON.parse(text) : {}
        const action = typeof body?.action === 'string' ? body.action : 'login'
        if (action === 'login') {
          const method = typeof body.method === 'string' ? body.method : undefined
          return Response.json(await login.start(method), { headers: JSON_HEADERS })
        }
        if (action === 'cancel') return Response.json(await login.cancel(), { headers: JSON_HEADERS })
        if (action === 'logout') {
          const view = await login.logout()
          reader.forget()
          return Response.json(view, { headers: JSON_HEADERS })
        }
        if (action === 'answer') {
          const id = Number(body.id)
          const value = typeof body.value === 'string' ? body.value : ''
          if (!Number.isInteger(id)) return Response.json(authFailure('bad-request'), { status: 400, headers: JSON_HEADERS })
          return Response.json(await login.answer(id, value), { headers: JSON_HEADERS })
        }
        return Response.json(authFailure('bad-request'), { status: 400, headers: JSON_HEADERS })
      } catch {
        return Response.json(authFailure('login-failed'), { status: 500, headers: JSON_HEADERS })
      }
    },
  })

  ctx.connection.fetch.register({
    path: QUOTA_PATH,
    methods: ['GET', 'POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      try {
        const card = await reader.read(request.method === 'POST')
        return Response.json(card, { headers: JSON_HEADERS })
      } catch {
        return Response.json(unavailable(), { headers: JSON_HEADERS })
      }
    },
  })
}
