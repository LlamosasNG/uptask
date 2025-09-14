import { Request, Response } from 'express'
import Project from '../models/Project'
import User from '../models/User'

export class TeamController {
  static findMemberByEmail = async (req: Request, res: Response) => {
    try {
      const { email } = req.body
      // Find user
      const user = await User.findOne({ email }).select('id email name')
      if (!user) {
        const error = new Error('Usuario no encontrado')
        res.status(404).json({ error: error.message })
        return
      }
      res.json(user)
    } catch (error) {
      res.status(500).json({ error: 'Hubo un error' })
    }
  }

  static addMemberById = async (req: Request, res: Response) => {
    try {
      const { id } = req.body
      // Find user
      const user = await User.findById(id).select('id')
      if (!user) {
        const error = new Error('Usuario no encontrado')
        res.status(404).json({ error: error.message })
        return
      }
      if (
        req.project.team.some((team) => team.toString() === user.id.toString())
      ) {
        const error = new Error('El usuario ya existe en este proyecto')
        res.status(409).json({ error: error.message })
        return
      }
      req.project.team.push(user.id)
      await req.project.save()
      res.send('Usuario agregado correctamente')
    } catch (error) {
      res.status(500).json({ error: 'Hubo un error' })
    }
  }

  static removeMemberById = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params
      if (!req.project.team.some((team) => team.toString() === userId)) {
        const error = new Error('El usuario no existe en este proyecto')
        res.status(409).json({ error: error.message })
        return
      }
      req.project.team = req.project.team.filter(
        (teamMember) => teamMember.toString() !== userId
      )
      await req.project.save()
      res.send('Usuario eliminado correctamente')
    } catch (error) {
      res.status(500).json({ error: 'Hubo un error' })
    }
  }

  static getProjectTeam = async (req: Request, res: Response) => {
    try {
      const project = await Project.findById(req.project.id).populate({
        path: 'team',
        select: 'id email name',
      })
      res.json(project.team)
    } catch (error) {
      res.status(500).json({ error: 'Hubo un error' })
    }
  }
}
