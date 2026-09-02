import { Request, RequestHandler, Response } from 'express'
import mongoose from 'mongoose'
import Task from '../models/Task'
import Note from '../models/Note'
import { asyncHandler } from '../middleware/error'

export class TaskController {
  static createTask: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        const task = new Task({ ...req.body, project: req.project._id })
        req.project.tasks.push(task._id)
        await task.save({ session })
        await req.project.save({ session })
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
      .populate({ path: 'notes', populate: { path: 'createdBy', select: 'id name email' } })
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
        req.project.tasks = req.project.tasks.filter((task) => task.toString() !== req.task._id.toString())
        await Note.deleteMany({ task: req.task._id }, { session })
        await Task.deleteOne({ _id: req.task._id }, { session })
        await req.project.save({ session })
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
