import { describe, expect, it } from 'vitest'

type EnvironmentInput = Record<string, string | undefined>
type ValidatedEnvironment = {
  DATABASE_URL: string
  JWT_SECRET: string
  FRONTEND_URL?: string
}

process.env.DATABASE_URL = 'mongodb://127.0.0.1:27017/uptask-env-test'
process.env.JWT_SECRET = 'test-secret'
process.env.NODE_ENV = 'test'

const configModule = await import('../src/config/env')
const { validateEnv } = configModule as unknown as {
  validateEnv: (input: EnvironmentInput) => ValidatedEnvironment
}

describe('environment validation', () => {
  it('rejects startup configuration without DATABASE_URL', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'test',
        JWT_SECRET: 'test-secret',
      })
    ).toThrow('Missing required environment variable: DATABASE_URL')
  })

  it('rejects startup configuration without JWT_SECRET', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'test',
        DATABASE_URL: 'mongodb://127.0.0.1:27017/uptask-test',
      })
    ).toThrow('Missing required environment variable: JWT_SECRET')
  })

  it('requires FRONTEND_URL in production', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'mongodb://127.0.0.1:27017/uptask',
        JWT_SECRET: 'production-secret',
      })
    ).toThrow('Missing required environment variable: FRONTEND_URL')
  })

  it('allows FRONTEND_URL to be omitted outside production', () => {
    expect(
      validateEnv({
        NODE_ENV: 'test',
        DATABASE_URL: 'mongodb://127.0.0.1:27017/uptask-test',
        JWT_SECRET: 'test-secret',
      })
    ).toEqual({
      DATABASE_URL: 'mongodb://127.0.0.1:27017/uptask-test',
      JWT_SECRET: 'test-secret',
      FRONTEND_URL: undefined,
    })
  })
})
