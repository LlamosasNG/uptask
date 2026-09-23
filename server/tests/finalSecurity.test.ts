import jwt from 'jsonwebtoken'
import { Types } from 'mongoose'
import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { projectSchema } from '../../client/src/types/index'
import Note from '../src/models/Note'
import Project from '../src/models/Project'
import Task from '../src/models/Task'
import User from '../src/models/User'
import { clearDatabase, startDatabase, stopDatabase } from './helpers/database'
import { auth, projectFixture } from './helpers/finalFixFixtures'

let app: Awaited<ReturnType<typeof startDatabase>>
beforeAll(async () => { app = await startDatabase() }, 60_000)
afterEach(async () => { vi.restoreAllMocks(); await clearDatabase() })
afterAll(stopDatabase)

describe('request fields and canonical relationship boundaries', () => {
  it('ignores project relationship and identity fields supplied by a new project manager', async () => {
    const { outsider, manager, member, task } = await projectFixture()
    const injectedId = new Types.ObjectId()
    const response = await request(app).post('/api/projects').set(auth(outsider._id)).send({
      _id: injectedId, projectName: 'Untrusted', clientName: 'Client', description: 'Description',
      manager: manager.id, team: [member.id], tasks: [task.id], createdAt: '2000-01-01',
    })
    expect(response.status).toBe(200)
    const created = await Project.findOne({ projectName: 'Untrusted' })
    const detail = await request(app).get(`/api/projects/${created!.id}`).set(auth(outsider._id))
    expect(detail.body.tasks).toEqual([])
    expect(detail.body.team).toEqual([])
    expect(detail.body.manager).toBe(outsider.id)
    expect(detail.body._id).not.toBe(injectedId.toString())
    expect(detail.body.createdAt).not.toContain('2000-01-01')
  })

  it('ignores task relationship, status, history and identity fields supplied at creation', async () => {
    const { manager, member, project, task } = await projectFixture()
    const foreignNote = await Note.create({ content: 'Secret', task: task._id, createdBy: member._id })
    const injectedId = new Types.ObjectId()
    const response = await request(app).post(`/api/projects/${project.id}/tasks`).set(auth(manager._id)).send({
      _id: injectedId, name: 'Injected task', description: 'Description', project: new Types.ObjectId(),
      status: 'completed', notes: [foreignNote.id],
      completedBy: [{ user: member.id, status: 'completed', createdAt: '2000-01-01' }],
      createdAt: '2000-01-01', priority: 'high', assignee: member.id, dueDate: '2030-01-01',
    })
    expect(response.status).toBe(200)
    const created = await Task.findOne({ name: 'Injected task' })
    const detail = await request(app).get(`/api/projects/${project.id}/tasks/${created!.id}`).set(auth(manager._id))
    expect(detail.body.notes).toEqual([])
    expect(detail.body.completedBy).toEqual([])
    expect(detail.body.status).toBe('pending')
    expect(detail.body.project).toBe(project.id)
    expect(detail.body._id).not.toBe(injectedId.toString())
    expect(detail.body.createdAt).not.toContain('2000-01-01')
    expect(detail.body).toMatchObject({ priority: 'high', assignee: { _id: member.id }, dueDate: '2030-01-01T00:00:00.000Z' })
  })

  it('does not disclose foreign task payloads from a previously polluted project array', async () => {
    const { manager, outsider, project, task } = await projectFixture()
    const foreignTask = await Task.create({ name: 'Secret task', description: 'Confidential', project: new Types.ObjectId() })
    await Project.updateOne({ _id: project._id }, { $push: { tasks: foreignTask._id } })
    const response = await request(app).get(`/api/projects/${project.id}`).set(auth(manager._id))
    expect(response.status).toBe(200)
    expect(response.body.tasks.map((entry: { _id: string }) => entry._id)).toEqual([task.id])
    expect(JSON.stringify(response.body)).not.toContain('Confidential')
    expect((await request(app).get(`/api/projects/${project.id}`).set(auth(outsider._id))).status).toBe(403)
  })

  it('does not disclose foreign note payloads from a previously polluted task array', async () => {
    const { member, project, task } = await projectFixture()
    const own = await Note.create({ content: 'Allowed', createdBy: member._id, task: task._id })
    const foreign = await Note.create({ content: 'Confidential', createdBy: member._id, task: new Types.ObjectId() })
    await Task.updateOne({ _id: task._id }, { $push: { notes: { $each: [own._id, foreign._id] } } })
    const response = await request(app).get(`/api/projects/${project.id}/tasks/${task.id}`).set(auth(member._id))
    expect(response.status).toBe(200)
    expect(response.body.notes.map((entry: { _id: string }) => entry._id)).toEqual([own.id])
    expect(JSON.stringify(response.body)).not.toContain('Confidential')
  })

  it('parses the real collaborator project HTTP response with the client project schema', async () => {
    const { member, project, task } = await projectFixture()
    const response = await request(app).get(`/api/projects/${project.id}`).set(auth(member._id))
    expect(response.status).toBe(200)
    const parsed = projectSchema.parse(response.body)
    expect(parsed.team).toEqual([member.id])
    expect(parsed.tasks[0]._id).toBe(task.id)
  })
})

describe('authentication failure classification', () => {
  it('propagates an unexpected user lookup error to the central 500 handler', async () => {
    const { manager } = await projectFixture()
    vi.spyOn(User.collection, 'findOne').mockRejectedValueOnce(new Error('database unavailable: private details'))
    const response = await request(app).get('/api/auth/user').set(auth(manager._id))
    expect(response.status).toBe(500)
    expect(response.body).toEqual({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Hubo un error' } })
  })

  it.each([
    ['missing', undefined], ['invalid', 'invalid-token'],
    ['missing user', jwt.sign({ _id: new Types.ObjectId() }, 'test-secret')],
    ['malformed subject', jwt.sign({ _id: 'not-an-id' }, 'test-secret')],
  ])('rejects a %s credential with 401', async (_label, token) => {
    const headers = { Origin: 'http://test.local', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    const response = await request(app).get('/api/auth/user').set(headers)
    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })
})

describe('trimmed nonempty string validation', () => {
  for (const method of ['post', 'put'] as const) {
    describe(method, () => {
      it.each([
        ['projectName', '   '], ['clientName', '\t '], ['description', '\n '],
        ['projectName', 42], ['clientName', ['Client']], ['description', { text: 'Description' }],
      ])('rejects invalid project %s (%j) before persistence', async (field, value) => {
        const { manager, project } = await projectFixture()
        const response = await request(app)[method](method === 'post' ? '/api/projects' : `/api/projects/${project.id}`)
          .set(auth(manager._id)).send({ projectName: 'Name', clientName: 'Client', description: 'Description', [field]: value })
        expect(response.status).toBe(422)
        expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR', fields: { [field]: expect.any(String) } })
        expect(await Project.countDocuments()).toBe(1)
        expect((await Project.findById(project.id))!.projectName).toBe('Atlas')
      })

      it.each([
        ['name', ' \n '], ['description', '\t '], ['name', 42], ['description', ['Description']],
      ])('rejects invalid task %s (%j) before persistence', async (field, value) => {
        const { manager, project, task } = await projectFixture()
        const url = `/api/projects/${project.id}/tasks${method === 'put' ? `/${task.id}` : ''}`
        const response = await request(app)[method](url).set(auth(manager._id))
          .send({ name: 'Name', description: 'Description', [field]: value })
        expect(response.status).toBe(422)
        expect(response.body.error).toMatchObject({ code: 'VALIDATION_ERROR', fields: { [field]: expect.any(String) } })
        expect(await Task.countDocuments()).toBe(1)
        expect((await Task.findById(task.id))!.name).toBe('Task')
      })
    })
  }
})
