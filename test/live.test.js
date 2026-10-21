import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveCodexExecutable } from '../lib/codex-bin.js'
import { SESSION_TIMEOUT_MS } from '../lib/quota/model.js'
import { readQuotaOnce } from '../lib/quota/session.js'

test('app-server handshake reads the account and the process exits', { timeout: SESSION_TIMEOUT_MS + 5_000 }, async () => {
  const executable = resolveCodexExecutable()
  const { card, pid } = await readQuotaOnce(executable, AbortSignal.timeout(SESSION_TIMEOUT_MS))
  assert.ok(pid !== undefined, 'app-server pid')
  assert.ok(card.status === 'logged-in' || card.status === 'logged-out')
  if (card.status === 'logged-in') {
    for (const window of card.windows) {
      assert.equal(typeof window.usedPercent, 'number')
      assert.ok(window.resetsAt === null || typeof window.resetsAt === 'number')
    }
  }
  assert.throws(() => process.kill(pid, 0))
})
