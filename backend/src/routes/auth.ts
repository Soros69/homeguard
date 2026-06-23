import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '../db/client.js'

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
})

export default async function authRoutes(app: FastifyInstance) {

  // POST /api/auth/login
  app.post('/login', async (req, reply) => {
    const body = loginSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    const { email, password } = body.data
    const result = await db.query('SELECT id, password_hash FROM users WHERE email = $1', [email.toLowerCase()])
    const user   = result.rows[0]

    // Constant-time compare even on missing user (prevent user enumeration)
    const hash    = user?.password_hash ?? '$2a$12$invalidhashfortimingreasons000000000000000000'
    const matches = await bcrypt.compare(password, hash)

    if (!user || !matches) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const token = app.jwt.sign({ sub: user.id }, { expiresIn: '7d' })
    return { token }
  })

  // POST /api/auth/register  (invite-only for beta — checks invite code)
  app.post('/register', async (req, reply) => {
    const body = z.object({
      email:       z.string().email(),
      password:    z.string().min(10),
      inviteCode:  z.string(),
    }).safeParse(req.body)

    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    // Beta: hardcode invite codes in env — swap for DB table later
    const validCodes = (process.env.INVITE_CODES ?? '').split(',').map(c => c.trim())
    if (!validCodes.includes(body.data.inviteCode)) {
      return reply.status(403).send({ error: 'Invalid invite code' })
    }

    const hash = await bcrypt.hash(body.data.password, 12)
    await db.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [body.data.email.toLowerCase(), hash]
    )

    return reply.status(201).send({ ok: true })
  })
}
