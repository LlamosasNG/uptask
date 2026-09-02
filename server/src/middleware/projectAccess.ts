import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../errors/HttpError'

export const requireProjectMember = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.project) {
    return next(new HttpError(403, 'FORBIDDEN', 'Acción no válida'))
  }

  const userId = req.user._id.toString()
  const isManager = req.project.manager.toString() === userId
  const isMember = req.project.team.some((member) => member.toString() === userId)
  if (!isManager && !isMember) {
    return next(new HttpError(403, 'FORBIDDEN', 'Acción no válida'))
  }

  next()
}

export const requireProjectManager = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.project || req.project.manager.toString() !== req.user._id.toString()) {
    return next(new HttpError(403, 'FORBIDDEN', 'Acción no válida'))
  }

  next()
}
