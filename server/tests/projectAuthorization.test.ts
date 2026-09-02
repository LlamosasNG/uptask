import jwt from 'jsonwebtoken'
import { Types } from 'mongoose'
import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import Note from '../src/models/Note'
import Project from '../src/models/Project'
import Task from '../src/models/Task'
import User from '../src/models/User'
import {
  clearDatabase,
  startDatabase,
  stopDatabase,
} from './helpers/database'

let app: Awaited<ReturnType<typeof startDatabase>>

const auth = (id: Types.ObjectId) => ({
  Authorization: `Bearer ${jwt.sign({ _id: id }, 'test-secret')}`,
  Origin: 'http://test.local',
})

async function projectFixture() {
  const [manager, member, outsider, newMember] = await User.create([
    { name: 'Manager', email: 'manager@example.com', password: 'secret' },
    { name: 'Member', email: 'member@example.com', password: 'secret' },
    { name: 'Outsider', email: 'outsider@example.com', password: 'secret' },
    { name: 'New member', email: 'new@example.com', password: 'secret' },
  ])
  const project = await Project.create({
    projectName: 'Atlas',
    clientName: 'Client',
    description: 'Project description',
    manager: manager._id,
    team: [member._id],
  })
  const task = await Task.create({
    name: 'Task',
    description: 'Task description',
    project: project._id,
  })
  project.tasks.push(task._id)
  await project.save()
  return { manager, member, outsider, newMember, project, task }
}

beforeAll(async () => {
  app = await startDatabase()
})

afterEach(clearDatabase)
afterAll(stopDatabase)

describe('project authorization', () => {
  it('rejects an invalid bearer token with the standard 401 error response', async () => {
    const response = await request(app)
      .get('/api/projects')
      .set({ Authorization: 'Bearer invalid-token', Origin: 'http://test.local' })

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Token no válido' },
    })
  })

  it.each([
    ['tasks', (id: string) => `/api/projects/${id}/tasks`],
    ['team', (id: string) => `/api/projects/${id}/team`],
    ['notes', (id: string, taskId: string) => `/api/projects/${id}/tasks/${taskId}/notes`],
  ])('rejects outsiders from reading a project\'s %s', async (_resource, path) => {
    const { outsider, project, task } = await projectFixture()

    const response = await request(app)
      .get(path(project.id, task.id))
      .set(auth(outsider._id))

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  it('rejects a collaborator from changing project metadata', async () => {
    const { member, project } = await projectFixture()

    const response = await request(app)
      .put(`/api/projects/${project.id}`)
      .set(auth(member._id))
      .send({ projectName: 'Changed', clientName: 'Client', description: 'Updated' })

    expect(response.status).toBe(403)
    expect((await Project.findById(project.id))?.projectName).toBe('Atlas')
  })

  it('rejects a collaborator from changing team membership', async () => {
    const { member, newMember, project } = await projectFixture()

    const response = await request(app)
      .post(`/api/projects/${project.id}/team`)
      .set(auth(member._id))
      .send({ id: newMember.id })

    expect(response.status).toBe(403)
    expect((await Project.findById(project.id))?.team.map(String)).not.toContain(newMember.id)
  })

  it('allows the manager to change project metadata and team membership', async () => {
    const { manager, newMember, project } = await projectFixture()

    const update = await request(app)
      .put(`/api/projects/${project.id}`)
      .set(auth(manager._id))
      .send({ projectName: 'Changed', clientName: 'Client', description: 'Updated' })
    const addMember = await request(app)
      .post(`/api/projects/${project.id}/team`)
      .set(auth(manager._id))
      .send({ id: newMember.id })

    expect(update.status).toBe(200)
    expect(addMember.status).toBe(200)
    expect((await Project.findById(project.id))?.team.map(String)).toContain(newMember.id)
  })

  it('does not delete a note belonging to another task nested under this project', async () => {
    const { member, project, task } = await projectFixture()
    const otherTask = await Task.create({
      name: 'Other task',
      description: 'Other description',
      project: project._id,
    })
    const note = await Note.create({ content: 'Elsewhere', createdBy: member._id, task: otherTask._id })

    const response = await request(app)
      .delete(`/api/projects/${project.id}/tasks/${task.id}/notes/${note.id}`)
      .set(auth(member._id))

    expect(response.status).toBe(404)
    expect(await Note.exists({ _id: note._id })).not.toBeNull()
  })
})
