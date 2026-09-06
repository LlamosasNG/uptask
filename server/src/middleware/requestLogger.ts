import type { RequestHandler } from 'express'

export type RequestLog = {
  timestamp: string
  method: string
  path: string
  status: number
  durationMs: number
}

type RequestLoggerOptions = {
  enabled?: boolean
  write?: (entry: RequestLog) => void
}

export function createRequestLogger({
  enabled = process.env.NODE_ENV !== 'test',
  write = (entry) => console.info(JSON.stringify(entry)),
}: RequestLoggerOptions = {}): RequestHandler {
  if (!enabled) {
    return (_request, _response, next) => next()
  }

  return (request, response, next) => {
    const timestamp = new Date().toISOString()
    const startedAt = process.hrtime.bigint()

    response.once('finish', () => {
      const elapsedNanoseconds = process.hrtime.bigint() - startedAt
      const routePath = request.route?.path
      write({
        timestamp,
        method: request.method,
        path: typeof routePath === 'string' ? routePath : '[unmatched]',
        status: response.statusCode,
        durationMs: Number((Number(elapsedNanoseconds) / 1_000_000).toFixed(3)),
      })
    })

    next()
  }
}
