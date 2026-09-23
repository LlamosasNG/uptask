import dns from 'node:dns'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startDatabase, stopDatabase } from './helpers/database'

let connectDB: typeof import('../src/config/db').connectDB

beforeAll(async () => {
  await startDatabase()
  connectDB = (await import('../src/config/db')).connectDB
}, 60_000)
afterAll(stopDatabase)

describe('MongoDB connection', () => {
  it('keeps the VPS DNS resolver configuration intact', async () => {
    const originalServers = dns.getServers()

    try {
      dns.setServers(['192.0.2.53'])
      await connectDB()

      expect(dns.getServers()).toEqual(['192.0.2.53'])
    } finally {
      dns.setServers(originalServers)
    }
  })
})
