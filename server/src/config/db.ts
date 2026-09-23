import colors from 'colors/safe'
import mongoose from 'mongoose'
import { exit } from 'node:process'
import { env } from './env'

export const connectDB = async () => {
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
