import request from 'supertest'
import type { Express } from 'express'
import { beforeAll, describe, expect, it } from 'vitest'

let app: Express

beforeAll(async () => {
  process.env.DATABASE_URL = 'mongodb://127.0.0.1:27017/uptask-cors-test'
  process.env.JWT_SECRET = 'test-secret'
  process.env.FRONTEND_URL = 'https://app.example.com'
  process.env.NODE_ENV = 'production'
  app = (await import('../src/server')).default
})

describe('production CORS', () => {
  it('lets a same-origin request without Origin reach authentication', async () => {
    const response = await request(app).get('/api/auth/user')

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns an allow-origin header for the configured frontend', async () => {
    const response = await request(app)
      .get('/api/auth/user')
      .set('Origin', 'https://app.example.com')

    expect(response.status).toBe(401)
    expect(response.headers['access-control-allow-origin']).toBe('https://app.example.com')
  })
})
