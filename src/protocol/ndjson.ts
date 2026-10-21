import { StringDecoder } from 'node:string_decoder'

/** JSON-RPC error that callers can branch on. The wire has no `jsonrpc` field. */
export class RpcError extends Error {
  constructor(
    message: string,
    readonly code: number,
    readonly data: unknown,
  ) {
    super(message)
    this.name = 'RpcError'
  }
}

export const OVERLOADED = -32001

interface Pending {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timer: NodeJS.Timeout
}

export interface NdjsonPeer {
  write(line: string): void
  onData(listener: (chunk: Buffer) => void): void
  onClose(listener: () => void): void
}

/**
 * Newline-delimited JSON-RPC without the `"jsonrpc":"2.0"` header.
 * Codex app-server rejects the standard envelope.
 */
export class NdjsonRpc {
  private readonly decoder = new StringDecoder('utf8')
  private buffer = ''
  private nextId = 1
  private readonly pending = new Map<number, Pending>()
  private closed = false

  constructor(private readonly peer: NdjsonPeer) {
    peer.onData((chunk) => this.push(chunk))
    peer.onClose(() => this.failAll(new Error('app-server connection closed')))
  }

  request(method: string, params: unknown, timeoutMs: number, signal?: AbortSignal): Promise<unknown> {
    if (this.closed) return Promise.reject(new Error('app-server connection is closed'))
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      const fail = (error: Error) => {
        clearTimeout(timer)
        this.pending.delete(id)
        reject(error)
      }
      const timer = setTimeout(() => fail(new Error(`${method} timed out after ${timeoutMs}ms`)), timeoutMs)
      const onAbort = () => fail(new Error(`${method} aborted`))
      if (signal?.aborted) {
        fail(new Error(`${method} aborted`))
        return
      }
      signal?.addEventListener('abort', onAbort, { once: true })
      this.pending.set(id, {
        resolve: (value) => {
          signal?.removeEventListener('abort', onAbort)
          resolve(value)
        },
        reject: (error) => {
          signal?.removeEventListener('abort', onAbort)
          reject(error)
        },
        timer,
      })
      this.send({ id, method, params })
    })
  }

  notify(method: string, params: unknown): void {
    this.send({ method, params })
  }

  close(): void {
    this.closed = true
    this.failAll(new Error('app-server connection closed'))
  }

  private send(value: unknown): void {
    this.peer.write(`${JSON.stringify(value)}\n`)
  }

  private push(chunk: Buffer): void {
    this.buffer += this.decoder.write(chunk)
    let nl = this.buffer.indexOf('\n')
    while (nl >= 0) {
      const line = this.buffer.slice(0, nl).trim()
      this.buffer = this.buffer.slice(nl + 1)
      if (line.length > 0) this.dispatch(line)
      nl = this.buffer.indexOf('\n')
    }
  }

  private dispatch(line: string): void {
    let message: Record<string, unknown>
    try {
      const parsed: unknown = JSON.parse(line)
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return
      message = parsed as Record<string, unknown>
    } catch {
      return
    }
    const id = message.id
    const method = message.method
    if (typeof id === 'number' && typeof method === 'string') {
      this.answerServer(id, method)
      return
    }
    if (typeof id !== 'number') return
    const pending = this.pending.get(id)
    if (pending === undefined) return
    clearTimeout(pending.timer)
    this.pending.delete(id)
    if (message.error !== undefined) {
      const error = message.error
      const code = error !== null && typeof error === 'object' && 'code' in error && typeof error.code === 'number'
        ? error.code
        : -32603
      const text = error !== null && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : 'app-server request failed'
      const data = error !== null && typeof error === 'object' && 'data' in error ? error.data : null
      pending.reject(new RpcError(text, code, data))
      return
    }
    pending.resolve(message.result)
  }

  /** Quota reads never approve tools. Answer the clock and refuse the rest. */
  private answerServer(id: number, method: string): void {
    if (method === 'currentTime/read') {
      this.send({ id, result: { timeMs: Date.now() } })
      return
    }
    this.send({ id, error: { code: -32601, message: `not handled: ${method}` } })
  }

  private failAll(error: Error): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer)
      pending.reject(error)
    }
    this.pending.clear()
  }
}
