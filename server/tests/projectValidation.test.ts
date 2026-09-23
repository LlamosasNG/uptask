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
  const manager = await User.create({ name: 'Manager', email: 'manager@example.com', password: 'secret' })
  const project = await Project.create({
    projectName: 'Atlas', clientName: 'Client', description: 'Project description', manager: manager._id,
  })
  const task = await Task.create({ name: 'Task', description: 'Task description', project: project._id })
  return { manager, project, task }
}

beforeAll(async () => { app = await startDatabase() }, 60_000)
afterEach(clearDatabase)
afterAll(stopDatabase)

describe('project validation', () => {
  it('rejects an invalid task status with a 422 field error', async () => {
    const { manager, project, task } = await fixture()

    const response = await request(app)
      .post(`/api/projects/${project.id}/tasks/${task.id}/status`)
      .set(auth(manager._id))
      .send({ status: 'done' })

    expect(response.status).toBe(422)
    expect(response.body).toEqual({
      error: { code: 'VALIDATION_ERROR', message: 'Datos no válidos', fields: { status: 'Estado no válido' } },
    })
  })

  it('rejects an empty task description with a 422 field error', async () => {
    const { manager, project, task } = await fixture()

    const response = await request(app)
      .put(`/api/projects/${project.id}/tasks/${task.id}`)
      .set(auth(manager._id))
      .send({ name: 'Task', description: '' })

    expect(response.status).toBe(422)
    expect(response.body.error).toEqual({
      code: 'VALIDATION_ERROR', message: 'Datos no válidos', fields: { description: 'La descripción es obligatoria' },
    })
  })
})
