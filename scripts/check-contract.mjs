/**
 * Check the two facts this plugin cannot control.
 *
 * The card reads a credential record that `@deepseek-ai/dsh-llm-pi-ai` owns and
 * `@earendil-works/pi-ai` fills. Neither is a published contract, so this verifies against
 * the installed copies that the record address and the grant's field names still hold. With
 * no DSH Desktop on this machine there is nothing to check, and the script says so.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const MODULES = '/Applications/DSH Desktop.app/Contents/Resources/app/node_modules'
const ADAPTER = join(MODULES, '@deepseek-ai/dsh-llm-pi-ai/lib/index.js')
const CODEX_OAUTH = join(MODULES, '@earendil-works/pi-ai/dist/auth/oauth/openai-codex.js')

if (!existsSync(ADAPTER) || !existsSync(CODEX_OAUTH)) {
  console.log('contract check skipped: no DSH Desktop install to read')
  process.exit(0)
}

const adapter = readFileSync(ADAPTER, 'utf8')
const oauth = readFileSync(CODEX_OAUTH, 'utf8')

const checks = [
  ['pi-ai writes credentials under the "llm-pi-ai" scope', adapter.includes('RECORD_SCOPE = "llm-pi-ai"')],
  ['the catalog still ships an "openai-codex" route', adapter.includes('"openai-codex"')],
  ['pi-ai still offers that route’s OAuth login', adapter.includes('UNSERVED_OAUTH') && !/UNSERVED_OAUTH = new Set\(\[[^\]]*openai-codex/.test(adapter)],
  ['the grant is tagged "oauth"', oauth.includes('type: "oauth"')],
  ['the grant carries access, refresh, expires, accountId', ['access:', 'refresh:', 'expires:', 'accountId'].every((field) => oauth.includes(field))],
  ['the account id comes from chatgpt_account_id', oauth.includes('chatgpt_account_id')],
  ['pi-ai registers an authorization flow for its own record key', adapter.includes('ctx.authorization.registerFlow') && adapter.includes('recordKeyFor(providerId)')],
  ['that flow still offers an "oauth" method', adapter.includes('session.method === "oauth"')],
]

const failed = checks.filter(([, ok]) => !ok)
for (const [what, ok] of checks) console.log(`${ok ? 'ok  ' : 'FAIL'}  ${what}`)
if (failed.length > 0) {
  console.error(`\n${failed.length} contract assumption(s) no longer hold; re-read the installed pi-ai before shipping`)
  process.exit(1)
}
