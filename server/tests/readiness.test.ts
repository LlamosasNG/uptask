import mongoose from 'mongoose'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startDatabase, stopDatabase } from './helpers/database'

let app: Awaited<ReturnType<typeof startDatabase>>

beforeAll(async () => { app = await startDatabase() }, 60_000)
afterAll(stopDatabase)

describe('GET /ready', () => {
  it('returns 200 while MongoDB accepts commands', async () => {
    const response = await request(app).get('/ready')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ready' })
  })

  it('returns 503 after MongoDB disconnects', async () => {
    await mongoose.disconnect()

    const response = await request(app).get('/ready')

    expect(response.status).toBe(503)
    expect(response.body).toEqual({ status: 'unavailable' })
  })
})
