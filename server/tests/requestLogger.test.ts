import express from 'express'
import request from 'supertest'
import { expect, it } from 'vitest'
import {
  createRequestLogger,
  type RequestLog,
} from '../src/middleware/requestLogger'

it('logs a matched route template without dynamic segments or credentials', async () => {
  const entries: RequestLog[] = []
  const app = express()
  const router = express.Router()
  app.use(express.json())
  app.use(
    createRequestLogger({
      enabled: true,
      write: (entry) => entries.push(entry),
    })
  )
  router.post('/update-password/:token', (_request, response) =>
    response.status(201).send()
  )
  app.use('/api/auth', router)

  await request(app)
    .post('/api/auth/update-password/path-secret?token=query-secret')
    .set('Authorization', 'Bearer header-secret')
    .send({ password: 'body-secret' })
    .expect(201)

  expect(entries).toHaveLength(1)
  expect(entries[0]).toEqual({
    timestamp: expect.any(String),
    method: 'POST',
    path: '/update-password/:token',
    status: 201,
    durationMs: expect.any(Number),
  })
  expect(JSON.stringify(entries[0])).not.toMatch(
    /path-secret|query-secret|header-secret|body-secret/
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
