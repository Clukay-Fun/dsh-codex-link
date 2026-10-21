import { resolveCodexExecutable } from './codex-bin.js'
import type { QuotaCard, QuotaWindow } from './quota/model.js'
import { QuotaReader } from './service.js'

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  if (index < 0) return undefined
  return process.argv[index + 1]
}

function windowLine(window: QuotaWindow): string {
  const reset = window.resetsAt === null ? '无重置时间' : new Date(window.resetsAt).toISOString()
  const duration = window.windowDurationMins === null ? '' : ` ${window.windowDurationMins}min`
  return `${window.id}${duration}  usedPercent=${window.usedPercent}  resetsAt=${reset}`
}

function printCard(card: QuotaCard): void {
  console.log(`status=${card.status}`)
  console.log(`freshness=${card.freshness}`)
  if (card.status === 'logged-in') {
    console.log(`planType=${card.planType ?? ''}`)
    console.log(`email=${card.email ?? ''}`)
  }
  if (card.status !== 'logged-in') console.log(`message=${card.message}`)
  if (card.windows.length === 0) console.log('windows=0')
  for (const window of card.windows) console.log(windowLine(window))
}

const reader = new QuotaReader({
  executable: resolveCodexExecutable(arg('--executable')),
  cacheTtlMs: 0,
})
const card = await reader.read(true)
printCard(card)
reader.dispose()
process.exit(card.status === 'query-failed' ? 1 : 0)
