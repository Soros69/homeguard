import 'dotenv/config'
import Fastify from 'fastify'
import cors       from '@fastify/cors'
import helmet     from '@fastify/helmet'
import jwt        from '@fastify/jwt'
import rateLimit  from '@fastify/rate-limit'

import authRoutes    from './routes/auth.js'
import deviceRoutes  from './routes/devices.js'
import accountRoutes from './routes/account.js'

const app = Fastify({ logger: true })

// ── Security plugins ──────────────────────────────────────────────
await app.register(helmet, { contentSecurityPolicy: false }) // CSP set by Vercel headers
await app.register(cors, {
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  credentials: true,
})
await app.register(rateLimit, {
  max: 60,           // 60 requests
  timeWindow: '1m',  // per minute per IP
})
await app.register(jwt, {
  secret: process.env.JWT_SECRET!,  // must be set — crashes if missing
})

// ── Health check (used by Fly.io) ─────────────────────────────────
app.get('/health', async () => ({ status: 'ok' }))

// ── Routes ────────────────────────────────────────────────────────
await app.register(authRoutes,    { prefix: '/api/auth' })
await app.register(deviceRoutes,  { prefix: '/api/devices' })
await app.register(accountRoutes, { prefix: '/api/account' })

// ── Start ─────────────────────────────────────────────────────────
const port = Number(process.env.PORT) || 4000
await app.listen({ port, host: '0.0.0.0' })
console.log(`HomeGuard API running on :${port}`)
