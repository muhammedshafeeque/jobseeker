import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import http from 'http'
import morgan from 'morgan'
import { connectDB } from './src/Config/db'
import { initSocket } from './src/Config/socket'
import router from './src/Routes'
import { errorHandler } from './src/Middleware/common.middleware'
import { CVTemplate } from './src/Modules/CVTemplates/cvTemplate.schema'
import { SEED_TEMPLATES } from './src/Modules/CVTemplates/cvTemplate.seed'

dotenv.config()

const app = express()
const httpServer = http.createServer(app)
const port = Number(process.env.PORT) || 6000

async function seedTemplates() {
  const count = await CVTemplate.countDocuments()
  if (count === 0) {
    await CVTemplate.insertMany(SEED_TEMPLATES)
    console.log(`Seeded ${SEED_TEMPLATES.length} CV templates`)
  }
}

connectDB().then(() => seedTemplates())
initSocket(httpServer)

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',').map(o => o.trim()).filter(Boolean)
app.use(cors({
  origin: allowedOrigins.length ? (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true)
    else cb(new Error('Not allowed by CORS'))
  } : '*',
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))

app.use('/api', router)

app.use(errorHandler)

httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
