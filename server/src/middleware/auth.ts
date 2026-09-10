import { NextFunction, Request, RequestHandler, Response } from 'express'
import jwt from 'jsonwebtoken'
import { isObjectIdOrHexString } from 'mongoose'
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
  let decoded: string | jwt.JwtPayload
  try {
    decoded = jwt.verify(token, env.JWT_SECRET)
  } catch {
    throw new HttpError(401, 'UNAUTHORIZED', 'Token no válido')
  }
  if (typeof decoded !== 'object' || !isObjectIdOrHexString(decoded._id)) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Token no válido')
  }
  const user = await User.findById(decoded._id).select('id email name')
  if (!user) throw new HttpError(401, 'UNAUTHORIZED', 'Token no válido')
  req.user = user
  next()
})
