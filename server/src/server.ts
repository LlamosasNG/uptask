import cors from 'cors'
import express, { Express } from 'express'
import morgan from 'morgan'
import { corsConfig } from './config/cors'
import './config/env'
import { errorHandler } from './middleware/error'
import { notFound } from './middleware/notFound'
import authRoutes from './routes/authRoutes'
import projectRoutes from './routes/projectRoutes'

/* Crear servidor */
const app: Express = express()
app.use(cors(corsConfig))

/* Loggin */
app.use(morgan('dev'))

/* Leer datos de formularios */
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
