const BACKOFF_MS = [250, 500, 1000]

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('aborted'))
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new Error('aborted'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/** Retry only what the caller calls transient. Everything else surfaces immediately. */
export async function withRetry<T>(
  run: () => Promise<T>,
  retryable: (error: unknown) => boolean,
  signal?: AbortSignal,
): Promise<T> {
  let last: unknown
  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt += 1) {
    try {
      return await run()
    } catch (error) {
      last = error
      const wait = BACKOFF_MS[attempt]
      if (!retryable(error) || wait === undefined) throw error
      await delay(wait, signal)
    }
  }
  throw last
}
