import { Request, RequestHandler, Response } from 'express'
import mongoose from 'mongoose'
import { HttpError } from '../errors/HttpError'
import Note from '../models/Note'
import Project from '../models/Project'
import Task from '../models/Task'
import { asyncHandler } from '../middleware/error'

export class ProjectController {
  static createProjects: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const project = new Project(req.body)
    project.manager = req.user._id
    await project.save()
    res.send('Proyecto creado correctamente')
  })

  static getAllProjects: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const projects = await Project.find({
      $or: [{ manager: req.user._id }, { team: req.user._id }],
    })
    res.json(projects)
  })

  static getProjectById: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findById(req.project._id).populate({
      path: 'tasks',
      populate: { path: 'assignee', select: '_id name' },
    })
    if (!project) throw new HttpError(404, 'NOT_FOUND', 'Proyecto no encontrado')
    res.json(project)
  })

  static updateProject: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    req.project.projectName = req.body.projectName
    req.project.clientName = req.body.clientName
    req.project.description = req.body.description
    await req.project.save()
    res.send('Proyecto actualizado correctamente')
  })

  static deleteProject: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        const taskIds = await Task.find({ project: req.project._id }).distinct('_id').session(session)
        await Note.deleteMany({ task: { $in: taskIds } }, { session })
        await Task.deleteMany({ project: req.project._id }, { session })
        await Project.deleteOne({ _id: req.project._id }, { session })
      })
      res.send('Proyecto eliminado correctamente')
    } finally {
      await session.endSession()
    }
  })
}
