import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

/** ChatGPT.app ships the CLI when `codex` is not on PATH. */
const MACOS_BUNDLED = '/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex'

export function resolveCodexExecutable(configured?: string): string {
  const wanted = configured?.trim() ?? ''
  if (wanted.length > 0 && wanted !== 'codex') return wanted
  const found = spawnSync('/usr/bin/which', ['codex'], { encoding: 'utf8' })
  const onPath = found.status === 0 ? found.stdout.trim() : ''
  if (onPath.length > 0) return onPath
  if (existsSync(MACOS_BUNDLED)) return MACOS_BUNDLED
  return wanted.length > 0 ? wanted : 'codex'
}
