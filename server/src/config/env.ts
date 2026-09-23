import dotenv from 'dotenv'

dotenv.config({ quiet: true })

type EnvironmentInput = Record<string, string | undefined>

function required(input: EnvironmentInput, name: string) {
  const value = input[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function validateEnv(input: EnvironmentInput) {
  const databaseUrl = required(input, 'DATABASE_URL')
  const jwtSecret = required(input, 'JWT_SECRET')
  const frontendUrl = input.FRONTEND_URL

  if (input.NODE_ENV === 'production' && !frontendUrl) {
    throw new Error('Missing required environment variable: FRONTEND_URL')
  }

  return {
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    FRONTEND_URL: frontendUrl,
  }
}

export const env = validateEnv(process.env)
