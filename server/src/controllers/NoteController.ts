import type { Request, RequestHandler, Response } from 'express'
import mongoose from 'mongoose'
import { HttpError } from '../errors/HttpError'
import Note, { INote } from '../models/Note'
import Task from '../models/Task'
import { asyncHandler } from '../middleware/error'

export class NoteController {
  static createNote: RequestHandler = asyncHandler(async (req: Request<{}, {}, INote>, res: Response) => {
    const { content } = req.body
    const noteId = new mongoose.Types.ObjectId()
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        const note = new Note({ _id: noteId, content, createdBy: req.user._id, task: req.task._id })
        await note.save({ session })
        const parent = await Task.updateOne(
          { _id: req.task._id, project: req.project._id }, { $addToSet: { notes: noteId } }, { session }
        )
        if (!parent.matchedCount) throw new HttpError(404, 'NOT_FOUND', 'Tarea no encontrada')
      })
      res.send('Nota Creada Correctamente')
    } finally {
      await session.endSession()
    }
  })

  static getTaskNotes: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const notes = await Note.find({ task: req.task._id })
    res.json(notes)
  })

  static deleteNote: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { noteId } = req.params
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        const note = await Note.findOne({ _id: noteId, task: req.task._id }).session(session)
        if (!note) throw new HttpError(404, 'NOT_FOUND', 'Nota no encontrada')
        if (note.createdBy.toString() !== req.user._id.toString()) {
          throw new HttpError(403, 'FORBIDDEN', 'Acción no válida')
        }
        await Task.updateOne({ _id: req.task._id }, { $pull: { notes: note._id } }, { session })
        await Note.deleteOne({ _id: note._id, task: req.task._id }, { session })
      })
      res.send('Nota Eliminada Correctamente')
    } finally {
      await session.endSession()
    }
  })
}
