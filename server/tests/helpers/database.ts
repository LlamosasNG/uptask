import type { Express } from 'express'
import mongoose from 'mongoose'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import Note from '../../src/models/Note'
import Project from '../../src/models/Project'
import Task from '../../src/models/Task'
import User from '../../src/models/User'

let replicaSet: MongoMemoryReplSet
let app: Express

export async function startDatabase() {
  process.env.JWT_SECRET = 'test-secret'
  process.env.FRONTEND_URL = 'http://test.local'
  replicaSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } })
  process.env.DATABASE_URL = replicaSet.getUri()
  await mongoose.connect(process.env.DATABASE_URL)
  app = (await import('../../src/server')).default
  return app
}

export async function clearDatabase() {
  await Promise.all([
    Note.deleteMany({}),
    Task.deleteMany({}),
    Project.deleteMany({}),
    User.deleteMany({}),
  ])
}

export async function stopDatabase() {
  await mongoose.disconnect()
  await replicaSet.stop()
}
