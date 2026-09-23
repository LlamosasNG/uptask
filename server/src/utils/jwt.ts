import jwt from 'jsonwebtoken'
import { Types } from 'mongoose'
import { env } from '../config/env'

type UserPayload = {
  _id: Types.ObjectId
}
export const generateJWT = (payload: UserPayload) => {
  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '180d',
  })
  return token
}
