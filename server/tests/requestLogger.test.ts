import express from 'express'
import request from 'supertest'
import { expect, it } from 'vitest'
import {
  createRequestLogger,
  type RequestLog,
} from '../src/middleware/requestLogger'

it('logs only safe request metadata without query values or credentials', async () => {
  const entries: RequestLog[] = []
  const app = express()
  app.use(express.json())
  app.use(
    createRequestLogger({
      enabled: true,
      write: (entry) => entries.push(entry),
    })
  )
  app.post('/resource', (_request, response) => response.status(201).send())

  await request(app)
    .post('/resource?token=query-secret')
    .set('Authorization', 'Bearer header-secret')
    .send({ password: 'body-secret' })
    .expect(201)

  expect(entries).toHaveLength(1)
  expect(entries[0]).toEqual({
    timestamp: expect.any(String),
    method: 'POST',
    path: '/resource',
    status: 201,
    durationMs: expect.any(Number),
  })
  expect(JSON.stringify(entries[0])).not.toMatch(
    /query-secret|header-secret|body-secret/
  )
})
