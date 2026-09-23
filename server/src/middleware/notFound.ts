import type { Request, Response } from 'express'
import { HttpError } from '../errors/HttpError'

export const notFound = (_req: Request, _res: Response) => {
  throw new HttpError(404, 'NOT_FOUND', 'Recurso no encontrado')
}
