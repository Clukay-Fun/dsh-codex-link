import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'protocol/generated')
const bundled = '/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex'

function executable() {
  if (process.env.CODEX_BIN && existsSync(process.env.CODEX_BIN)) return process.env.CODEX_BIN
  const found = spawnSync('/usr/bin/which', ['codex'], { encoding: 'utf8' })
  if (found.status === 0 && found.stdout.trim()) return found.stdout.trim()
  if (existsSync(bundled)) return bundled
  throw new Error('codex executable not found')
}

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
const result = spawnSync(executable(), ['app-server', 'generate-ts', '--experimental', '--out', out], {
  stdio: 'inherit',
})
if (result.status !== 0) process.exit(result.status ?? 1)
