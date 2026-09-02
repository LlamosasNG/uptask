import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { isValidObjectId } from 'mongoose'
import Task, { ITask } from '../models/Task'
import { HttpError } from '../errors/HttpError'
import { asyncHandler } from './error'

declare global {
  namespace Express {
    interface Request {
      task?: ITask
    }
  }
}
export const taskExists: RequestHandler = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!isValidObjectId(req.params.taskId)) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'Datos no válidos', { taskId: 'ID no válido' })
  }
  const task = await Task.findById(req.params.taskId)
  if (!task) {
    throw new HttpError(404, 'NOT_FOUND', 'Tarea no encontrada')
  }
  req.task = task
  next()
})

export const taskBelongsToProject: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.task || !req.project || req.task.project.toString() !== req.project._id.toString()) {
    return next(new HttpError(404, 'NOT_FOUND', 'Tarea no encontrada'))
  }
  next()
}
