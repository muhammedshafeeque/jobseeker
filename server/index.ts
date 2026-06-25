import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import helmet from 'helmet'
import http from 'http'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { connectDB } from './src/Config/db'
import { initSocket } from './src/Config/socket'
import router from './src/Routes'
import { errorHandler, notFoundHandler } from './src/Middleware/common.middleware'
import mongoose from 'mongoose'
import { CVTemplate } from './src/Modules/CVTemplates/cvTemplate.schema'
import { SEED_TEMPLATES } from './src/Modules/CVTemplates/cvTemplate.seed'

dotenv.config()

const app = express()
const httpServer = http.createServer(app)
const port = Number(process.env.PORT) || 6000
const isProd = process.env.NODE_ENV === 'production'

async function migrate() {
  const db = mongoose.connection.db!
  const staleIndexes: Array<{ collection: string; index: string }> = [
    { collection: 'gmail_tokens', index: 'email_1' },
  ]
  for (const { collection, index } of staleIndexes) {
    try {
      await db.collection(collection).dropIndex(index)
      console.log(`Migration: dropped stale index "${index}" on ${collection}`)
    } catch {
      // index doesn't exist — nothing to do
    }
  }
}

async function seedTemplates() {
  const count = await CVTemplate.countDocuments()
  if (count === 0) {
    await CVTemplate.insertMany(SEED_TEMPLATES)
    console.log(`Seeded ${SEED_TEMPLATES.length} CV templates`)
  }
}

connectDB().then(async () => {
  await migrate()
  await seedTemplates()
})
initSocket(httpServer)

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // React SPA manages its own CSP
  crossOriginEmbedderPolicy: false,
}))
app.set('trust proxy', 1) // needed for accurate IPs behind nginx/reverse proxy

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',').map(o => o.trim()).filter(Boolean)

app.use(cors({
  origin: allowedOrigins.length
    ? (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) cb(null, true)
        else cb(new Error('Not allowed by CORS'))
      }
    : '*',
  credentials: true,
}))

// ── Rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please slow down.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts, try again later.' },
})

// AI endpoints are expensive — strict limit
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'AI request limit reached, wait a moment.' },
})

app.use('/api', globalLimiter)
app.use('/api/auth', authLimiter)
app.use('/api/cv/tailor', aiLimiter)
app.use('/api/cv/pdf', aiLimiter)
app.use('/api/cv/cover-letter', aiLimiter)
app.use('/api/cv/ats-score', aiLimiter)
app.use('/api/cv/interview-prep', aiLimiter)

// ── Logging ───────────────────────────────────────────────────────────────────
// 'combined' in prod omits colour codes, includes real IP; 'dev' in local dev
app.use(morgan(isProd ? 'combined' : 'dev'))

// ── Body parsing — keep JSON tight; file uploads go through multer ────────────
app.use(express.json({ limit: '512kb' }))

app.use('/api', router)

app.use(notFoundHandler)
app.use(errorHandler)

httpServer.listen(port, () => {
  console.log(`Server running on port ${port} [${isProd ? 'production' : 'development'}]`)
})
