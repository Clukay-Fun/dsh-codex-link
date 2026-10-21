import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..', 'protocol/generated')

function read(name) {
  return readFileSync(resolve(root, name), 'utf8')
}

const client = read('ClientRequest.ts')
const windowType = read('v2/RateLimitWindow.ts')
const accountParams = read('v2/GetAccountParams.ts')
const required = [
  ['account/read', client],
  ['account/rateLimits/read', client],
  ['account/usage/read', client],
  ['usedPercent', windowType],
  ['resetsAt', windowType],
  ['refreshToken', accountParams],
]

const missing = required.filter(([needle, text]) => !text.includes(needle))
if (missing.length > 0) {
  console.error(`generated protocol is missing: ${missing.map(([needle]) => needle).join(', ')}`)
  process.exit(1)
}

console.log('generated protocol includes account/read, account/rateLimits/read, account/usage/read, usedPercent, resetsAt')
