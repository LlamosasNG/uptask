import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { HttpError } from '../errors/HttpError'

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>

export const asyncHandler = (handler: AsyncRequestHandler): RequestHandler =>
  (req, res, next) => {
    void handler(req, res, next).catch(next)
  }

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    })
  }

  console.error(error)
  return res.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Hubo un error' },
  })
}
