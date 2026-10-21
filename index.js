import { resolveCodexExecutable } from './lib/codex-bin.js'
import { DEFAULT_CACHE_TTL_MS } from './lib/quota/model.js'
import { QuotaReader } from './lib/service.js'

export const name = 'dsh-codex-quota'
export const inject = ['connection']

const QUOTA_PATH = '/api/codex-quota'

function cacheTtl(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : DEFAULT_CACHE_TTL_MS
}

function emptyFailure(message) {
  return {
    status: 'query-failed',
    freshness: 'empty',
    fetchedAt: null,
    message,
    planType: null,
    windows: [],
  }
}

/** Host half: one authenticated route. It never registers a model provider. */
export function apply(ctx, config = {}) {
  const reader = new QuotaReader({
    executable: resolveCodexExecutable(typeof config.executable === 'string' ? config.executable : ''),
    cacheTtlMs: cacheTtl(config.cacheTtlMs),
  })
  ctx.effect(() => () => reader.dispose(), 'dsh-codex-quota: stop app-server')
  ctx.connection.fetch.register({
    path: QUOTA_PATH,
    methods: ['GET', 'POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      try {
        const card = await reader.read(request.method === 'POST')
        return Response.json(card, { headers: { 'cache-control': 'no-store' } })
      } catch (error) {
        const message = error instanceof Error ? error.message : '额度查询失败'
        return Response.json(emptyFailure(message), { headers: { 'cache-control': 'no-store' } })
      }
    },
  })
}
