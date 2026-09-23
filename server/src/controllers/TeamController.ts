import { Request, RequestHandler, Response } from 'express'
import mongoose from 'mongoose'
import Project from '../models/Project'
import Task from '../models/Task'
import User from '../models/User'
import { HttpError } from '../errors/HttpError'
import { asyncHandler } from '../middleware/error'

export class TeamController {
  static findMemberByEmail: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body
    const user = await User.findOne({ email }).select('id email name')
    if (!user) throw new HttpError(404, 'NOT_FOUND', 'Usuario no encontrado')
    res.json(user)
  })

  static addMemberById: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.body
    const user = await User.findById(id).select('id')
    if (!user) throw new HttpError(404, 'NOT_FOUND', 'Usuario no encontrado')
    if (req.project.team.some((team) => team.toString() === user.id.toString())) {
      throw new HttpError(409, 'CONFLICT', 'El usuario ya existe en este proyecto')
    }
    req.project.team.push(user._id)
    await req.project.save()
    res.send('Usuario agregado correctamente')
  })

  static removeMemberById: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    if (!req.project.team.some((team) => team.toString() === userId)) {
      throw new HttpError(404, 'NOT_FOUND', 'El usuario no existe en este proyecto')
    }
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        await Task.updateMany(
          { project: req.project._id, assignee: userId },
          { assignee: null },
          { session }
        )
        await Project.updateOne({ _id: req.project._id }, { $pull: { team: userId } }, { session })
      })
    } finally {
      await session.endSession()
    }
    res.send('Usuario eliminado correctamente')
  })

  static getProjectTeam: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findById(req.project._id).populate({ path: 'team', select: 'id email name' })
    if (!project) throw new HttpError(404, 'NOT_FOUND', 'Proyecto no encontrado')
    res.json(project.team)
  })
}
