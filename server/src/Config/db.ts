import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const mongoUri =
  process.env.MONGO_URI || 'mongodb://localhost:27017/portfolio'

export const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('Error connecting to MongoDB', error)
    process.exit(1)
  }
}