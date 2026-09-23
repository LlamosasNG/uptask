import mongoose from 'mongoose'
import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import Note from '../src/models/Note'
import Project from '../src/models/Project'
import Task from '../src/models/Task'
import { clearDatabase, startDatabase, stopDatabase } from './helpers/database'
import { auth, projectFixture } from './helpers/finalFixFixtures'
import { failTransactionAfterWrites } from './helpers/transactionFaults'

let app: Awaited<ReturnType<typeof startDatabase>>
beforeAll(async () => { app = await startDatabase() }, 60_000)
afterEach(async () => { vi.restoreAllMocks(); await clearDatabase() })
afterAll(stopDatabase)

it('does not carry an aborted task reference into a retry after the parent write fails', async () => {
  const { manager, project, task: existing } = await projectFixture()
  const error = new mongoose.mongo.MongoServerError({ message: 'Transient parent write failure' })
  error.addErrorLabel('TransientTransactionError')
  vi.spyOn(Project.collection, 'updateOne').mockRejectedValueOnce(error)
  const response = await request(app).post(`/api/projects/${project.id}/tasks`).set(auth(manager._id))
    .send({ name: 'New task', description: 'Description' })
  expect(response.status).toBe(200)
  const tasks = await Task.find({ project: project._id })
  expect(tasks).toHaveLength(2)
  const created = tasks.find((task) => task.id !== existing.id)!
  expect((await Project.findById(project.id))!.tasks.map(String).sort()).toEqual([existing.id, created.id].sort())
})

describe.each(['transient', 'permanent'] as const)('%s failure after all transaction writes', (kind) => {
  it('creates exactly one task and reference on retry, or rolls back both on final failure', async () => {
    const { manager, project, task: existing } = await projectFixture()
    failTransactionAfterWrites(kind)
    const response = await request(app).post(`/api/projects/${project.id}/tasks`).set(auth(manager._id))
      .send({ name: 'New task', description: 'Description' })
    expect(response.status).toBe(kind === 'transient' ? 200 : 500)
    const tasks = await Task.find({ project: project._id })
    const savedProject = await Project.findById(project.id)
    if (kind === 'transient') {
      expect(tasks).toHaveLength(2)
      const created = tasks.find((task) => task.id !== existing.id)!
      expect(savedProject!.tasks.map(String).sort()).toEqual([existing.id, created.id].sort())
    } else {
      expect(tasks.map((task) => task.id)).toEqual([existing.id])
      expect(savedProject!.tasks.map(String)).toEqual([existing.id])
    }
  })

  it('creates exactly one note and reference on retry, or rolls back both on final failure', async () => {
    const { member, project, task } = await projectFixture()
    failTransactionAfterWrites(kind)
    const response = await request(app).post(`/api/projects/${project.id}/tasks/${task.id}/notes`).set(auth(member._id))
      .send({ content: 'New note' })
    expect(response.status).toBe(kind === 'transient' ? 200 : 500)
    const notes = await Note.find({ task: task._id })
    const savedTask = await Task.findById(task.id)
    if (kind === 'transient') {
      expect(notes).toHaveLength(1)
      expect(savedTask!.notes.map(String)).toEqual([notes[0].id])
    } else {
      expect(notes).toHaveLength(0)
      expect(savedTask!.notes).toEqual([])
    }
  })

  it('deletes a task, notes and reference on retry, or retains all three on final failure', async () => {
    const { manager, member, project, task } = await projectFixture()
    const note = await Note.create({ content: 'Keep until commit', task: task._id, createdBy: member._id })
    failTransactionAfterWrites(kind)
    const response = await request(app).delete(`/api/projects/${project.id}/tasks/${task.id}`).set(auth(manager._id))
    expect(response.status).toBe(kind === 'transient' ? 200 : 500)
    expect(await Task.countDocuments({ _id: task._id })).toBe(kind === 'transient' ? 0 : 1)
    expect(await Note.countDocuments({ _id: note._id })).toBe(kind === 'transient' ? 0 : 1)
    expect((await Project.findById(project.id))!.tasks.map(String)).toEqual(kind === 'transient' ? [] : [task.id])
  })

  it('deletes a note and its reference on retry, or retains both on final failure', async () => {
    const { member, project, task } = await projectFixture()
    const [note, kept] = await Note.create([
      { content: 'Delete', task: task._id, createdBy: member._id },
      { content: 'Keep', task: task._id, createdBy: member._id },
    ])
    await Task.updateOne({ _id: task._id }, { $push: { notes: { $each: [note._id, kept._id] } } })
    failTransactionAfterWrites(kind)
    const response = await request(app).delete(`/api/projects/${project.id}/tasks/${task.id}/notes/${note.id}`).set(auth(member._id))
    expect(response.status).toBe(kind === 'transient' ? 200 : 500)
    expect(await Note.countDocuments({ _id: note._id })).toBe(kind === 'transient' ? 0 : 1)
    expect(await Note.countDocuments({ _id: kept._id })).toBe(1)
    expect((await Task.findById(task.id))!.notes.map(String)).toEqual(kind === 'transient' ? [kept.id] : [note.id, kept.id])
  })

  it('removes team access and assignments on retry, or retains both on final failure', async () => {
    const { manager, member, project, task } = await projectFixture()
    await Task.updateOne({ _id: task._id }, { assignee: member._id })
    failTransactionAfterWrites(kind)
    const response = await request(app).delete(`/api/projects/${project.id}/team/${member.id}`).set(auth(manager._id))
    expect(response.status).toBe(kind === 'transient' ? 200 : 500)
    expect((await Project.findById(project.id))!.team.map(String)).toEqual(kind === 'transient' ? [] : [member.id])
    const savedTask = await Task.findById(task.id)
    expect(savedTask!.assignee?.toString() ?? null).toBe(kind === 'transient' ? null : member.id)
  })
})
