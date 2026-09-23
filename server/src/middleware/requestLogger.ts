import type { Request, RequestHandler } from 'express'
import morgan from 'morgan'

type RequestLoggerOptions = {
  enabled?: boolean
  write?: (line: string) => void
}

const requestLogFormat =
  ':date[iso] :method :safe-route :status :total-time ms - :res[content-length]'

const requestLogRouteBase = Symbol('requestLogRouteBase')

type RequestWithLogRouteBase = Request & {
  [requestLogRouteBase]?: string
}

export function setRequestLogRouteBase(routeBase: string): RequestHandler {
  return (request, _response, next) => {
    const loggableRequest = request as RequestWithLogRouteBase
    loggableRequest[requestLogRouteBase] = routeBase
    next()
  }
}

function getSafeRoute(request: RequestWithLogRouteBase, routePath: string) {
  return `${request[requestLogRouteBase] ?? ''}${routePath}`
}

morgan.token('safe-route', (request) => {
  const expressRequest = request as RequestWithLogRouteBase
  const routePath = expressRequest.route?.path

  return typeof routePath === 'string'
    ? getSafeRoute(expressRequest, routePath)
    : '[unmatched]'
})

export function createRequestLogger({
  enabled = process.env.NODE_ENV !== 'test',
  write = (line) => console.info(line),
}: RequestLoggerOptions = {}): RequestHandler {
  if (!enabled) {
    return (_request, _response, next) => next()
  }

  return morgan(requestLogFormat, {
    stream: {
      write: (line) => write(line.trimEnd()),
    },
  })
}
