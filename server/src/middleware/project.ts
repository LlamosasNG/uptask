import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { isValidObjectId } from 'mongoose'
import Project, { IProject } from '../models/Project'
import { HttpError } from '../errors/HttpError'
import { asyncHandler } from './error'

declare global {
  namespace Express {
    interface Request {
      project?: IProject
    }
  }
}
export const projectExists: RequestHandler = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const projectId = req.params.projectId ?? req.params.id
  if (!isValidObjectId(projectId)) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'Datos no válidos', { projectId: 'ID no válido' })
  }
  const project = await Project.findById(projectId)
  if (!project) {
    throw new HttpError(404, 'NOT_FOUND', 'Proyecto no encontrado')
  }
  req.project = project
  next()
})
