import { NextFunction, Request, RequestHandler, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { HttpError } from '../errors/HttpError'
import { asyncHandler } from './error'
import User, { IUser } from '../models/User'

declare global {
  namespace Express {
    interface Request {
      user?: IUser
    }
  }
}

export const authenticate: RequestHandler = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const bearer = req.headers.authorization
  if (!bearer?.startsWith('Bearer ')) {
    throw new HttpError(401, 'UNAUTHORIZED', 'No autorizado')
  }
  const token = bearer.split(' ')[1]
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    if (typeof decoded === 'object' && decoded._id) {
      const user = await User.findById(decoded._id).select('id email name')
      if (user) {
        req.user = user
        return next()
      } else {
        throw new HttpError(401, 'UNAUTHORIZED', 'Token no válido')
      }
    }
    throw new HttpError(401, 'UNAUTHORIZED', 'Token no válido')
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(401, 'UNAUTHORIZED', 'Token no válido')
  }
})
