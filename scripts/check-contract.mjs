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
const CODEX_CATALOG = join(MODULES, '@earendil-works/pi-ai/dist/providers/data/openai-codex.json')
const PATCH = new URL('../cordis.patch.yml', import.meta.url)

// Only a missing adapter means there is no install to check. A pi-ai file that moved is a
// broken assumption, so it fails below instead of skipping every other check with it.
if (!existsSync(ADAPTER)) {
  console.log('contract check skipped: no DSH Desktop install to read')
  process.exit(0)
}

const readIf = (path) => existsSync(path) ? readFileSync(path, 'utf8') : ''
const adapter = readFileSync(ADAPTER, 'utf8')
const oauth = readIf(CODEX_OAUTH)
const catalog = readIf(CODEX_CATALOG)

// The patch's model list: an id the catalog no longer ships would lose its endpoint and size.
const listed = [...readFileSync(PATCH, 'utf8').matchAll(/^ {10}- \{ id: ([\w.-]+), reasoningEfforts/gm)].map((match) => match[1])
const catalogIds = new Set([...catalog.matchAll(/"id":\s*"([^"]+)"/g)].map((match) => match[1]))

const checks = [
  ['pi-ai’s Codex OAuth module is where this reads it', oauth.length > 0],
  ['pi-ai’s Codex model catalog is where this reads it', catalog.length > 0],
  ['pi-ai writes credentials under the "llm-pi-ai" scope', adapter.includes('RECORD_SCOPE = "llm-pi-ai"')],
  ['the catalog still ships an "openai-codex" route', adapter.includes('"openai-codex"')],
  ['pi-ai still offers that route’s OAuth login', adapter.includes('UNSERVED_OAUTH') && !/UNSERVED_OAUTH = new Set\(\[[^\]]*openai-codex/.test(adapter)],
  ['the grant is tagged "oauth"', oauth.includes('type: "oauth"')],
  ['the grant carries access, refresh, expires, accountId', ['access:', 'refresh:', 'expires:', 'accountId'].every((field) => oauth.includes(field))],
  ['the account id comes from chatgpt_account_id', oauth.includes('chatgpt_account_id')],
  ['pi-ai registers an authorization flow for its own record key', adapter.includes('ctx.authorization.registerFlow') && adapter.includes('recordKeyFor(providerId)')],
  ['that flow still offers an "oauth" method', adapter.includes('session.method === "oauth"')],
  ['the patch lists at least one model', listed.length > 0],
  ...listed.map((id) => [`the catalog still ships "${id}"`, catalogIds.has(id)]),
  ['pi-ai still takes the route default from `reasoning`', adapter.includes('reasoning: z.union(THINKING_LEVELS)') && adapter.includes('describableReasoningLevel(resolvedModel, profile.reasoning)')],
  ['pi-ai still fills listed models from the catalog and accepts reasoningEfforts', adapter.includes('models: z.array(modelProfile)') && adapter.includes('const base = defaults.get(entry.id)') && adapter.includes('reasoningEfforts: z.union([z.const(false), reasoningEfforts])')],
  ['pi-ai still signs Codex in as the client sign-out revokes against', oauth.includes('const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"')],
]

const failed = checks.filter(([, ok]) => !ok)
for (const [what, ok] of checks) console.log(`${ok ? 'ok  ' : 'FAIL'}  ${what}`)
if (failed.length > 0) {
  console.error(`\n${failed.length} contract assumption(s) no longer hold; re-read the installed pi-ai before shipping`)
  process.exit(1)
}
