import request from 'supertest'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthEmail } from '../src/emails/AuthEmail'
import Token from '../src/models/Token'
import User from '../src/models/User'
import { checkPassword, hashPassword } from '../src/utils/auth'
import { clearDatabase, startDatabase, stopDatabase } from './helpers/database'
import { failTransactionAfterWrites } from './helpers/transactionFaults'

let app: Awaited<ReturnType<typeof startDatabase>>
let deliveries: string[]
beforeAll(async () => { app = await startDatabase() }, 60_000)
beforeEach(() => {
  deliveries = []
  const deliver = async ({ token, email }: { token: string; email: string }) => {
    const user = await User.findOne({ email })
    expect(user).not.toBeNull()
    expect(await Token.countDocuments({ user: user!._id, token })).toBe(1)
    deliveries.push(token)
  }
  vi.spyOn(AuthEmail, 'sendConfirmationEmail').mockImplementation(deliver)
  vi.spyOn(AuthEmail, 'sendPasswordResetToken').mockImplementation(deliver)
})
afterEach(async () => { vi.restoreAllMocks(); await Token.deleteMany({}); await clearDatabase() })
afterAll(stopDatabase)
const origin = { Origin: 'http://test.local' }
const credentials = { name: 'Ana', email: 'ana@example.com', password: 'new-password', password_confirmation: 'new-password' }
async function recoveryFixture() {
  const user = await User.create({ name: 'Ana', email: credentials.email, password: await hashPassword('old-password') })
  const token = await Token.create({ user: user._id, token: '123456' })
  return { user, token }
}

describe('authentication compound writes', () => {
  it.each(['user', 'token'])('rolls registration back when the %s insert fails and sends no email', async (target) => {
    vi.spyOn(target === 'user' ? User.collection : Token.collection, 'insertOne').mockRejectedValueOnce(new Error('write failure'))
    const response = await request(app).post('/api/auth/create-account').set(origin).send(credentials)
    expect(response.status).toBe(500)
    expect(await User.countDocuments()).toBe(0)
    expect(await Token.countDocuments()).toBe(0)
    expect(deliveries).toEqual([])
  })

  it('commits registration before delivering the confirmation email', async () => {
    expect((await request(app).post('/api/auth/create-account').set(origin).send(credentials)).status).toBe(200)
    expect(deliveries).toHaveLength(1)
    expect(await checkPassword(credentials.password, (await User.findOne())!.password)).toBe(true)
  })

  it('reports a delivery failure without implying the committed account was rolled back', async () => {
    vi.mocked(AuthEmail.sendConfirmationEmail).mockRejectedValueOnce(new Error('provider unavailable'))
    const response = await request(app).post('/api/auth/create-account').set(origin).send(credentials)
    expect(response.status).toBe(500)
    expect(response.body.error).toContain('cuenta se creó')
    expect(response.body.error).toContain('solicita un nuevo código')
    expect(await User.countDocuments()).toBe(1)
    expect(await Token.countDocuments()).toBe(1)
  })

  it.each(['request-code', 'forgot-password', 'login'])('reports durable code state when %s email delivery fails', async (route) => {
    await recoveryFixture()
    vi.mocked(AuthEmail.sendConfirmationEmail).mockRejectedValueOnce(new Error('provider unavailable'))
    vi.mocked(AuthEmail.sendPasswordResetToken).mockRejectedValueOnce(new Error('provider unavailable'))
    const response = await request(app).post(`/api/auth/${route}`).set(origin).send(credentials)
    expect(response.status).toBe(500)
    expect(response.body.error).toContain('código se guardó')
    expect(await Token.countDocuments()).toBe(1)
  })

  it.each(['confirm-account', 'update-password/123456'])('retains the recovery token and credentials when %s user update fails', async (route) => {
    const { user, token } = await recoveryFixture()
    vi.spyOn(User.collection, 'updateOne').mockRejectedValueOnce(new Error('write failure'))
    const response = await request(app).post(`/api/auth/${route}`).set(origin).send({ ...credentials, token: token.token })
    expect(response.status).toBe(500)
    expect(await Token.countDocuments({ _id: token._id })).toBe(1)
    const saved = await User.findById(user._id)
    expect(saved!.confirmed).toBe(false)
    expect(await checkPassword('old-password', saved!.password)).toBe(true)
  })

  it.each(['confirm-account', 'update-password/123456'])('rolls back the user update when %s token deletion fails', async (route) => {
    const { user, token } = await recoveryFixture()
    vi.spyOn(Token.collection, 'deleteOne').mockRejectedValueOnce(new Error('write failure'))
    expect((await request(app).post(`/api/auth/${route}`).set(origin).send({ ...credentials, token: token.token })).status).toBe(500)
    const saved = await User.findById(user._id)
    expect(saved!.confirmed).toBe(false)
    expect(await checkPassword('old-password', saved!.password)).toBe(true)
    expect(await Token.countDocuments({ _id: token._id })).toBe(1)
  })

  it.each(['request-code', 'forgot-password', 'login'])('preserves the previous token when %s replacement fails', async (route) => {
    const { token } = await recoveryFixture()
    vi.spyOn(Token.collection, 'insertOne').mockRejectedValueOnce(new Error('write failure'))
    expect((await request(app).post(`/api/auth/${route}`).set(origin).send(credentials)).status).toBe(500)
    expect((await Token.find()).map((value) => value.token)).toEqual([token.token])
    expect(deliveries).toEqual([])
  })

  it.each(['request-code', 'forgot-password', 'login'])('replaces the previous token durably before %s email', async (route) => {
    await recoveryFixture()
    expect((await request(app).post(`/api/auth/${route}`).set(origin).send(credentials)).status).toBe(route === 'login' ? 401 : 200)
    expect(deliveries).toHaveLength(1)
    expect((await Token.find()).map((value) => value.token)).toEqual(deliveries)
  })

  it.each(['confirm-account', 'update-password/123456'])('retries %s with fresh documents and consumes the token once', async (route) => {
    const { user } = await recoveryFixture()
    failTransactionAfterWrites('transient')
    expect((await request(app).post(`/api/auth/${route}`).set(origin).send({ ...credentials, token: '123456' })).status).toBe(200)
    expect(await Token.countDocuments()).toBe(0)
    const saved = await User.findById(user._id)
    if (route === 'confirm-account') expect(saved!.confirmed).toBe(true)
    else expect(await checkPassword(credentials.password, saved!.password)).toBe(true)
  })
})
