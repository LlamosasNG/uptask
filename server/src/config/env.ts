import dotenv from 'dotenv'

dotenv.config()

function required(name: 'DATABASE_URL' | 'JWT_SECRET') {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET: required('JWT_SECRET'),
  FRONTEND_URL: process.env.FRONTEND_URL,
}
