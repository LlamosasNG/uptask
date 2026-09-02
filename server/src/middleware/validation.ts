import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { HttpError } from '../errors/HttpError'

export const handleInputErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const fields = Object.fromEntries(
      errors.array().map((error) => [error.type === 'field' ? error.path : 'request', error.msg])
    )
    return next(new HttpError(422, 'VALIDATION_ERROR', 'Datos no válidos', fields))
  }
  next()
}
