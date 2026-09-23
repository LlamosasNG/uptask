import express from 'express'
import request from 'supertest'
import { afterEach, expect, it, vi } from 'vitest'
import { errorHandler } from '../src/middleware/error'

afterEach(() => vi.restoreAllMocks())

it('does not print raw unexpected errors or stack traces', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  const app = express()
  app.get('/failure', () => {
    throw new Error('password=do-not-log-this')
  })
  app.use(errorHandler)

  const response = await request(app).get('/failure')

  expect(response.status).toBe(500)
  expect(response.body).toEqual({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Hubo un error' },
  })
  expect(consoleError).not.toHaveBeenCalled()
})
