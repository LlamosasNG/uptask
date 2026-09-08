import express from 'express'
import request from 'supertest'
import { expect, it } from 'vitest'
import {
  createRequestLogger,
  type RequestLog,
} from '../src/middleware/requestLogger'
import { errorHandler } from '../src/middleware/error'

process.env.DATABASE_URL = 'mongodb://127.0.0.1:27017/uptask-logger-test'
process.env.JWT_SECRET = 'test-secret'
process.env.FRONTEND_URL = 'http://test.local'
process.env.NODE_ENV = 'test'

const authRoutes = (await import('../src/routes/authRoutes')).default

it('logs a matched route template without dynamic segments or credentials', async () => {
  const entries: RequestLog[] = []
  const app = express()
  app.use(express.json())
  app.use(
    createRequestLogger({
      enabled: true,
      write: (entry) => entries.push(entry),
    })
  )
  app.use('/api/auth', authRoutes)
  app.use(errorHandler)

  await request(app)
    .post('/api/auth/update-password/739182640517?token=query-secret')
    .set('Authorization', 'Bearer header-secret')
    .send({
      password: 'body-secret-password',
      password_confirmation: 'different-secret-password',
    })
    .expect(422)

  expect(entries).toHaveLength(1)
  expect(entries[0]).toEqual({
    timestamp: expect.any(String),
    method: 'POST',
    path: '/update-password/:token',
    status: 422,
    durationMs: expect.any(Number),
  })
  expect(JSON.stringify(entries[0])).not.toMatch(
    /739182640517|query-secret|header-secret|body-secret|different-secret/
  )
})

it('uses a constant safe path when no Express route matched', async () => {
  const entries: RequestLog[] = []
  const app = express()
  app.use(
    createRequestLogger({
      enabled: true,
      write: (entry) => entries.push(entry),
    })
  )

  await request(app)
    .get('/unmatched/path-secret?token=query-secret')
    .set('Authorization', 'Bearer header-secret')
    .expect(404)

  expect(entries).toHaveLength(1)
  expect(entries[0].path).toBe('[unmatched]')
  expect(JSON.stringify(entries[0])).not.toMatch(
    /path-secret|query-secret|header-secret/
  )
})
