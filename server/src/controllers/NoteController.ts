import type { Request, RequestHandler, Response } from 'express'
import mongoose from 'mongoose'
import { HttpError } from '../errors/HttpError'
import Note, { INote } from '../models/Note'
import { asyncHandler } from '../middleware/error'

export class NoteController {
  static createNote: RequestHandler = asyncHandler(async (req: Request<{}, {}, INote>, res: Response) => {
    const { content } = req.body
    const note = new Note()
    note.content = content
    note.createdBy = req.user._id
    note.task = req.task._id
    req.task.notes.push(note._id)

    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        await note.save({ session })
        await req.task.save({ session })
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
    const note = await Note.findById(noteId)

    if (!note) {
      throw new HttpError(404, 'NOT_FOUND', 'Nota no encontrada')
    }
    if (note.task.toString() !== req.task._id.toString()) {
      throw new HttpError(404, 'NOT_FOUND', 'Nota no encontrada')
    }
    if (note.createdBy.toString() !== req.user._id.toString()) {
      throw new HttpError(403, 'FORBIDDEN', 'Acción no válida')
    }
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        req.task.notes = req.task.notes.filter((taskNote) => taskNote.toString() !== noteId)
        await req.task.save({ session })
        await Note.deleteOne({ _id: note._id }, { session })
      })
      res.send('Nota Eliminada Correctamente')
    } finally {
      await session.endSession()
    }
  })
}
