import colors from 'colors/safe'
import dns from 'dns'
import mongoose from 'mongoose'
import { exit } from 'node:process'
import { env } from './env'

export const connectDB = async () => {
  dns.setServers(['8.8.8.8'])
  dns.setDefaultResultOrder('ipv4first')
  try {
    const { connection } = await mongoose.connect(env.DATABASE_URL)
    const url = `${connection.host}:${connection.port}`
    console.log(colors.bold(colors.magenta(`MongoDB connected: ${url}`)))
  } catch (error) {
    //console.log(error.message)
    console.log(colors.bold(colors.red('Error connecting to MongoDB')))
    exit(1)
  }
}
