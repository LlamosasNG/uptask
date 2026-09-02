import jwt from 'jsonwebtoken'
import { Types } from 'mongoose'
import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
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

async function fixture() {
  const [manager, member, outsider] = await User.create([
    { name: 'Manager', email: 'manager@example.com', password: 'secret' },
    { name: 'Member', email: 'member@example.com', password: 'secret' },
    { name: 'Outsider', email: 'outsider@example.com', password: 'secret' },
  ])
  const project = await Project.create({
    projectName: 'Atlas',
    clientName: 'Client',
    description: 'Project description',
    manager: manager._id,
    team: [member._id],
  })
  return { manager, member, outsider, project }
}

async function createTask(projectId: string, managerId: Types.ObjectId, body: Record<string, unknown>) {
  return request(app)
    .post(`/api/projects/${projectId}/tasks`)
    .set(auth(managerId))
    .send({ name: 'Roadmap', description: 'Plan the next release', ...body })
}

beforeAll(async () => { app = await startDatabase() }, 60_000)
afterEach(clearDatabase)
afterAll(stopDatabase)

describe('task planning API', () => {
  it('defaults new tasks to medium priority with nullable planning fields', async () => {
    const { manager, project } = await fixture()

    const create = await createTask(project.id, manager._id, {})
    const task = await Task.findOne({ project: project._id })
    const response = await request(app)
      .get(`/api/projects/${project.id}/tasks/${task?.id}`)
      .set(auth(manager._id))

    expect(create.status).toBe(200)
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      priority: 'medium',
      dueDate: null,
      assignee: null,
    })
  })

  it.each([
    ['priority', { priority: 'urgent' }, 'La prioridad no es válida'],
    ['due date', { dueDate: 'not-a-date' }, 'La fecha de vencimiento no es válida'],
  ])('rejects an invalid task %s with a 422 field error', async (_field, body, message) => {
    const { manager, project } = await fixture()

    const response = await createTask(project.id, manager._id, body)

    expect(response.status).toBe(422)
    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos no válidos',
        fields: { [Object.keys(body)[0]]: message },
      },
    })
  })

  it('rejects assigning a task to a user outside the project', async () => {
    const { manager, outsider, project } = await fixture()

    const response = await createTask(project.id, manager._id, { assignee: outsider.id })

    expect(response.status).toBe(422)
    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos no válidos',
        fields: { assignee: 'El usuario asignado debe pertenecer al proyecto' },
      },
    })
  })

  it('persists a team-member assignee and populates it in project and task responses', async () => {
    const { manager, member, project } = await fixture()

    const create = await createTask(project.id, manager._id, {
      assignee: member.id,
      dueDate: '2030-05-01',
      priority: 'high',
    })
    const task = await Task.findOne({ project: project._id })
    const projectResponse = await request(app)
      .get(`/api/projects/${project.id}`)
      .set(auth(manager._id))
    const taskResponse = await request(app)
      .get(`/api/projects/${project.id}/tasks/${task?.id}`)
      .set(auth(manager._id))

    const expectedAssignee = { _id: member.id, name: 'Member' }
    expect(create.status).toBe(200)
    expect(projectResponse.body.tasks[0]).toMatchObject({
      priority: 'high',
      assignee: expectedAssignee,
    })
    expect(taskResponse.body).toMatchObject({
      priority: 'high',
      dueDate: '2030-05-01T00:00:00.000Z',
      assignee: expectedAssignee,
    })
  })

  it('updates planning fields, including clearing nullable fields', async () => {
    const { manager, member, project } = await fixture()
    const task = await Task.create({
      name: 'Roadmap',
      description: 'Plan the next release',
      project: project._id,
    })

    const update = await request(app)
      .put(`/api/projects/${project.id}/tasks/${task.id}`)
      .set(auth(manager._id))
      .send({
        name: 'Updated roadmap',
        description: 'Updated release plan',
        assignee: member.id,
        dueDate: '2030-06-01',
        priority: 'low',
      })
    const clear = await request(app)
      .put(`/api/projects/${project.id}/tasks/${task.id}`)
      .set(auth(manager._id))
      .send({
        name: 'Updated roadmap',
        description: 'Updated release plan',
        assignee: null,
        dueDate: null,
        priority: 'medium',
      })
    const response = await request(app)
      .get(`/api/projects/${project.id}/tasks/${task.id}`)
      .set(auth(manager._id))

    expect(update.status).toBe(200)
    expect(clear.status).toBe(200)
    expect(response.body).toMatchObject({
      name: 'Updated roadmap',
      description: 'Updated release plan',
      priority: 'medium',
      dueDate: null,
      assignee: null,
    })
  })

  it('clears a removed member from tasks assigned to them', async () => {
    const { manager, member, project } = await fixture()
    const create = await createTask(project.id, manager._id, { assignee: member.id })
    const task = await Task.findOne({ project: project._id })

    const remove = await request(app)
      .delete(`/api/projects/${project.id}/team/${member.id}`)
      .set(auth(manager._id))
    const response = await request(app)
      .get(`/api/projects/${project.id}/tasks/${task?.id}`)
      .set(auth(manager._id))

    expect(create.status).toBe(200)
    expect(remove.status).toBe(200)
    expect(response.body.assignee).toBeNull()
  })

  it('records an ISO creation time for every status-history entry', async () => {
    const { manager, project } = await fixture()
    const task = await Task.create({
      name: 'Roadmap',
      description: 'Plan the next release',
      project: project._id,
    })

    const update = await request(app)
      .post(`/api/projects/${project.id}/tasks/${task.id}/status`)
      .set(auth(manager._id))
      .send({ status: 'inProgress' })
    const response = await request(app)
      .get(`/api/projects/${project.id}/tasks/${task.id}`)
      .set(auth(manager._id))

    expect(update.status).toBe(200)
    expect(response.body.completedBy).toHaveLength(1)
    expect(response.body.completedBy[0]).toMatchObject({ status: 'inProgress' })
    expect(Date.parse(response.body.completedBy[0].createdAt)).not.toBeNaN()
  })
})
