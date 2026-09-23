import cors from 'cors'
import express, { Express } from 'express'
import mongoose from 'mongoose'
import { corsConfig } from './config/cors'
import './config/env'
import { errorHandler } from './middleware/error'
import { notFound } from './middleware/notFound'
import {
  createRequestLogger,
  setRequestLogRouteBase,
} from './middleware/requestLogger'
import authRoutes from './routes/authRoutes'
import projectRoutes from './routes/projectRoutes'

/* Crear servidor */
const app: Express = express()
app.use(createRequestLogger())

app.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok' })
})

app.get('/ready', async (_request, response) => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    response.status(503).json({ status: 'unavailable' })
    return
  }

  try {
    await mongoose.connection.db.admin().ping()
    response.status(200).json({ status: 'ready' })
  } catch {
    response.status(503).json({ status: 'unavailable' })
  }
})

app.use(cors(corsConfig))

/* Leer datos de formularios */
app.use(express.json())

app.use('/api/auth', setRequestLogRouteBase('/api/auth'), authRoutes)
app.use('/api/projects', setRequestLogRouteBase('/api/projects'), projectRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
