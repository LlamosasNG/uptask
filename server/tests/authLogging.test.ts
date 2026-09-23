import express from 'express'
import request from 'supertest'
import { afterEach, expect, it, vi } from 'vitest'
import User from '../src/models/User'

process.env.DATABASE_URL = 'mongodb://127.0.0.1:27017/uptask-auth-log-test'
process.env.JWT_SECRET = 'test-secret'
process.env.FRONTEND_URL = 'http://test.local'
process.env.NODE_ENV = 'test'

const authRoutes = (await import('../src/routes/authRoutes')).default

afterEach(() => vi.restoreAllMocks())

it('does not print a raw database error when login fails unexpectedly', async () => {
  const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(User, 'findOne').mockRejectedValueOnce(
    new Error('password=do-not-log-this')
  )
  const app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)

  const response = await request(app).post('/api/auth/login').send({
    email: 'user@example.com',
    password: 'valid-password',
  })

  expect(response.status).toBe(500)
  expect(response.body).toEqual({
    error: 'Hubo un error al intentar iniciar sesión',
  })
  expect(consoleLog).not.toHaveBeenCalled()
})
