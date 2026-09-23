import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Express } from 'express'

let app: Express

beforeAll(async () => {
  process.env.DATABASE_URL = 'mongodb://127.0.0.1:27017/uptask-health-test'
  process.env.JWT_SECRET = 'test-secret'
  process.env.NODE_ENV = 'test'
  app = (await import('../src/server')).default
})

describe('GET /health', () => {
  it('returns a lightweight unauthenticated liveness response', async () => {
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })
})
