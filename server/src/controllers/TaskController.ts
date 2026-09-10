import { Request, RequestHandler, Response } from 'express'
import mongoose from 'mongoose'
import Task from '../models/Task'
import Note from '../models/Note'
import Project from '../models/Project'
import { HttpError } from '../errors/HttpError'
import { asyncHandler } from '../middleware/error'

export class TaskController {
  static createTask: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const taskId = new mongoose.Types.ObjectId()
    const { name, description, assignee, dueDate, priority } = req.body
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        const task = new Task({ _id: taskId, name, description, assignee, dueDate, priority, project: req.project._id })
        await task.save({ session })
        const parent = await Project.updateOne(
          { _id: req.project._id }, { $addToSet: { tasks: taskId } }, { session }
        )
        if (!parent.matchedCount) throw new HttpError(404, 'NOT_FOUND', 'Proyecto no encontrado')
      })
      res.send('Tarea creada correctamente')
    } finally {
      await session.endSession()
    }
  })

  static getProjectTasks: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const tasks = await Task.find({ project: req.project._id })
      .populate({ path: 'project' })
      .populate({ path: 'assignee', select: '_id name' })
    res.json(tasks)
  })

  static getTaksById: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const task = await Task.findById(req.task._id)
      .populate({ path: 'assignee', select: '_id name' })
      .populate({ path: 'completedBy.user', select: 'id name email' })
      .populate({ path: 'notes', match: { task: req.task._id }, populate: { path: 'createdBy', select: 'id name email' } })
    res.json(task)
  })

  static updateTask: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    req.task.name = req.body.name
    req.task.description = req.body.description
    if ('assignee' in req.body) req.task.assignee = req.body.assignee
    if ('dueDate' in req.body) req.task.dueDate = req.body.dueDate
    if ('priority' in req.body) req.task.priority = req.body.priority
    await req.task.save()
    res.send('Tarea actualizada correctamente')
  })

  static deleteTask: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        await Note.deleteMany({ task: req.task._id }, { session })
        await Task.deleteOne({ _id: req.task._id, project: req.project._id }, { session })
        await Project.updateOne({ _id: req.project._id }, { $pull: { tasks: req.task._id } }, { session })
      })
      res.send('Tarea eliminada correctamente')
    } finally {
      await session.endSession()
    }
  })

  static updateStatus: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body
    req.task.status = status
    req.task.completedBy.push({ user: req.user._id, status })
    await req.task.save()
    res.send('Tarea actualizada correctamente')
  })
}
