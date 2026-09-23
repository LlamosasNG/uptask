import express from 'express'
import request from 'supertest'
import { expect, it } from 'vitest'
import {
  createRequestLogger,
  setRequestLogRouteBase,
} from '../src/middleware/requestLogger'
import { errorHandler } from '../src/middleware/error'

process.env.DATABASE_URL = 'mongodb://127.0.0.1:27017/uptask-logger-test'
process.env.JWT_SECRET = 'test-secret'
process.env.FRONTEND_URL = 'http://test.local'
process.env.NODE_ENV = 'test'

const authRoutes = (await import('../src/routes/authRoutes')).default

it('logs a readable request line with the full safe route template', async () => {
  const lines: unknown[] = []
  const app = express()
  app.use(express.json())
  app.use(
    createRequestLogger({
      enabled: true,
      write: (line) => lines.push(line),
    })
  )
  app.use('/api/auth', setRequestLogRouteBase('/api/auth'), authRoutes)
  app.use(errorHandler)

  await request(app)
    .post('/api/auth/update-password/739182640517?token=query-secret')
    .set('Authorization', 'Bearer header-secret')
    .send({
      password: 'body-secret-password',
      password_confirmation: 'different-secret-password',
    })
    .expect(422)

  expect(lines).toHaveLength(1)
  expect(String(lines[0])).toMatch(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z POST \/api\/auth\/update-password\/:token 422 \d+(?:\.\d+)? ms - \d+$/
  )
  expect(String(lines[0])).not.toMatch(
    /739182640517|query-secret|header-secret|body-secret|different-secret/
  )
})

it('uses a constant safe path when no Express route matched', async () => {
  const lines: unknown[] = []
  const app = express()
  app.use(
    createRequestLogger({
      enabled: true,
      write: (line) => lines.push(line),
    })
  )

  await request(app)
    .get('/unmatched/path-secret?token=query-secret')
    .set('Authorization', 'Bearer header-secret')
    .expect(404)

  expect(lines).toHaveLength(1)
  expect(String(lines[0])).toMatch(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z GET \[unmatched\] 404 \d+(?:\.\d+)? ms - \d+$/
  )
  expect(String(lines[0])).not.toMatch(
    /path-secret|query-secret|header-secret/
  )
})

it('never derives a parameterized mount path from request values', async () => {
  const lines: unknown[] = []
  const app = express()
  const router = express.Router()
  app.use(
    createRequestLogger({
      enabled: true,
      write: (line) => lines.push(line),
    })
  )
  router.get('/items/:itemId', (_request, response) => response.sendStatus(204))
  app.use(
    '/parents/:parentId',
    setRequestLogRouteBase('/parents/:parentId'),
    router
  )

  await request(app)
    .get('/parents/parent-secret/items/item-secret?token=query-secret')
    .expect(204)

  expect(lines).toHaveLength(1)
  expect(String(lines[0])).toContain(
    'GET /parents/:parentId/items/:itemId 204'
  )
  expect(String(lines[0])).not.toMatch(
    /parent-secret|item-secret|query-secret/
  )
})

it('reports the total time until the response body finishes', async () => {
  const lines: unknown[] = []
  const app = express()
  const responseDelayMs = 60
  app.use(
    createRequestLogger({
      enabled: true,
      write: (line) => lines.push(line),
    })
  )
  app.get('/stream', (_request, response) => {
    response.write('first')
    setTimeout(() => response.end('last'), responseDelayMs)
  })

  await request(app).get('/stream').expect(200)

  const duration = Number(String(lines[0]).match(/ (\d+(?:\.\d+)?) ms -/)?.[1])
  expect(duration).toBeGreaterThanOrEqual(responseDelayMs * 0.75)
})
