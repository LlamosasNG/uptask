import { Request, RequestHandler, Response } from 'express'
import Project from '../models/Project'
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
      throw new HttpError(409, 'CONFLICT', 'El usuario no existe en este proyecto')
    }
    req.project.team = req.project.team.filter((teamMember) => teamMember.toString() !== userId)
    await req.project.save()
    res.send('Usuario eliminado correctamente')
  })

  static getProjectTeam: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findById(req.project._id).populate({ path: 'team', select: 'id email name' })
    if (!project) throw new HttpError(404, 'NOT_FOUND', 'Proyecto no encontrado')
    res.json(project.team)
  })
}
