import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { PI_AI_RECORD_KEY, type GrantRecordLike } from './quota/grant.js'
import type { QuotaCard, QuotaWindow } from './quota/model.js'
import { QuotaReader } from './service.js'

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  if (index < 0) return undefined
  return process.argv[index + 1]
}

function scalar(raw: string): string | number | boolean {
  const text = raw.trim().replace(/^['"]|['"]$/g, '')
  if (text === 'true') return true
  if (text === 'false') return false
  const number = Number(text)
  return text !== '' && Number.isFinite(number) ? number : text
}

/**
 * One record out of the credentials document.
 *
 * In the harness this plugin is handed `ctx.credentials`. This command runs outside it, so
 * it reads the same file to answer "what would the card show right now". The reader covers
 * only the shape pi-ai writes — a `grant` whose payload is flat scalars — and returns
 * nothing for anything else rather than pretending to be a YAML parser.
 */
async function readRecordFromFile(path: string, key: string): Promise<GrantRecordLike | undefined> {
  let text: string
  try {
    text = await readFile(path, 'utf8')
  } catch {
    return undefined
  }
  const lines = text.split('\n')
  const head = lines.findIndex((line) => line.trimEnd() === `  ${key}:`)
  if (head < 0) return undefined
  const payload: Record<string, unknown> = {}
  let kind: string | undefined
  let inPayload = false
  for (const line of lines.slice(head + 1)) {
    if (line.trim() === '') continue
    const indent = line.length - line.trimStart().length
    if (indent <= 2) break
    if (indent === 4) {
      const [name, ...rest] = line.trim().split(':')
      if (name === 'payload') inPayload = true
      else {
        inPayload = false
        if (name === 'kind') kind = String(scalar(rest.join(':')))
      }
      continue
    }
    if (inPayload && indent === 6) {
      const [name, ...rest] = line.trim().split(':')
      if (name !== undefined && rest.length > 0) payload[name] = scalar(rest.join(':'))
    }
  }
  return kind === undefined ? undefined : { kind, payload }
}

function windowLine(window: QuotaWindow): string {
  const reset = window.resetsAt === null ? 'no reset' : new Date(window.resetsAt).toISOString()
  const duration = window.windowDurationMins === null ? '' : ` ${window.windowDurationMins}min`
  return `${window.id}${duration}  usedPercent=${window.usedPercent}  resetsAt=${reset}`
}

function printCard(card: QuotaCard): void {
  console.log(`status=${card.status}`)
  console.log(`freshness=${card.freshness}`)
  console.log(`planType=${card.planType ?? ''}`)
  if (card.status !== 'logged-in') console.log(`message=${card.message}`)
  if (card.windows.length === 0) console.log('windows=0')
  for (const window of card.windows) console.log(windowLine(window))
}

const store = arg('--credentials') ?? join(homedir(), '.dsh', '.credentials.yaml')
console.log(`store=${store}`)
console.log(`record=${PI_AI_RECORD_KEY}`)
const reader = new QuotaReader({
  credentials: { readRecord: (key) => readRecordFromFile(store, key) },
  cacheTtlMs: 0,
})
const card = await reader.read(true)
printCard(card)
reader.dispose()
process.exit(card.status === 'query-failed' ? 1 : 0)
