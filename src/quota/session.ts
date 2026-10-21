import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { NdjsonRpc, RpcError } from '../protocol/ndjson.js'
import { withOverloadRetry } from '../protocol/retry.js'
import {
  ACCOUNT_READ_TIMEOUT_MS,
  RATE_LIMIT_TIMEOUT_MS,
  type LoggedOutCard,
  type QuotaCard,
} from './model.js'
import { parseAccount, parseRateLimits } from './parse.js'

const AUTH_REQUIRED = -32600

function loggedOut(message: string): LoggedOutCard {
  return {
    status: 'logged-out',
    freshness: 'empty',
    fetchedAt: null,
    message,
    planType: null,
    windows: [],
  }
}

function isAuthFailure(error: unknown): boolean {
  return error instanceof RpcError && (error.code === AUTH_REQUIRED || /authentication required/i.test(error.message))
}

export interface CodexProcess {
  readonly pid: number | undefined
  close(): Promise<void>
}

/** One app-server process for a single quota read. Inference traffic never shares it. */
export class AppServerSession implements CodexProcess {
  private constructor(
    private readonly child: ChildProcessWithoutNullStreams,
    private readonly rpc: NdjsonRpc,
  ) {}

  get pid(): number | undefined {
    return this.child.pid
  }

  static async start(executable: string, signal: AbortSignal): Promise<AppServerSession> {
    const child = spawn(executable, ['app-server'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
    })
    child.on('error', () => {
      // `close` rejects the pending handshake. The listener keeps Node from crashing.
    })
    const rpc = new NdjsonRpc({
      write: (line) => {
        try {
          if (!child.stdin.destroyed) child.stdin.write(line)
        } catch {
          // The child can exit between the destroyed check and the write.
        }
      },
      onData: (listener) => child.stdout.on('data', listener),
      onClose: (listener) => child.once('close', listener),
    })
    const session = new AppServerSession(child, rpc)
    if (signal.aborted) {
      await session.close()
      throw new Error('aborted before initialize')
    }
    try {
      await rpc.request('initialize', {
        clientInfo: {
          name: 'dsh-codex-quota',
          title: 'DSH Codex Quota',
          version: '0.1.0',
        },
        capabilities: {
          experimentalApi: true,
          requestAttestation: false,
        },
      }, 15_000, signal)
      rpc.notify('initialized', {})
    } catch (error) {
      await session.close()
      throw error
    }
    return session
  }

  request(method: string, params: unknown, timeoutMs: number, signal: AbortSignal): Promise<unknown> {
    return withOverloadRetry(() => this.rpc.request(method, params, timeoutMs, signal), signal)
  }

  async close(): Promise<void> {
    this.rpc.close()
    const exited = new Promise<void>((resolve) => {
      if (this.child.exitCode !== null || this.child.signalCode !== null) {
        resolve()
        return
      }
      this.child.once('close', () => resolve())
    })
    try {
      this.child.stdin.end()
    } catch {
      // Already closed.
    }
    if (this.child.exitCode === null && this.child.signalCode === null) this.child.kill('SIGTERM')
    let timer: NodeJS.Timeout
    const timed = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), 1_000)
    })
    const result = await Promise.race([exited.then(() => 'exited' as const), timed])
    clearTimeout(timer!)
    if (result === 'timeout' && this.child.exitCode === null && this.child.signalCode === null) {
      this.child.kill('SIGKILL')
      await exited
    }
  }
}

/** Handshake, then account/read, then rate limits. Auth is decided before the quota call. */
export async function readQuotaOnce(
  executable: string,
  signal: AbortSignal,
  now = Date.now(),
): Promise<{ card: QuotaCard, pid: number | undefined }> {
  const session = await AppServerSession.start(executable, signal)
  const pid = session.pid
  try {
    let accountPayload: unknown
    try {
      accountPayload = await session.request('account/read', { refreshToken: true }, ACCOUNT_READ_TIMEOUT_MS, signal)
    } catch (error) {
      if (isAuthFailure(error)) return { card: loggedOut('Codex 未登录'), pid }
      throw error
    }
    const account = parseAccount(accountPayload)
    if (!account.loggedIn) return { card: loggedOut('Codex 未登录'), pid }
    let limitsPayload: unknown
    try {
      limitsPayload = await session.request('account/rateLimits/read', {}, RATE_LIMIT_TIMEOUT_MS, signal)
    } catch (error) {
      if (isAuthFailure(error)) return { card: loggedOut('Codex 未登录'), pid }
      throw error
    }
    const limits = parseRateLimits(limitsPayload)
    return {
      pid,
      card: {
        status: 'logged-in',
        freshness: 'fresh',
        fetchedAt: now,
        planType: account.planType ?? limits.planType,
        email: account.email,
        windows: limits.windows,
      },
    }
  } finally {
    await session.close()
  }
}
