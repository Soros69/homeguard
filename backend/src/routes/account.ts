import type { FastifyInstance } from 'fastify'
import { db } from '../db/client.js'

export default async function accountRoutes(app: FastifyInstance) {
  // Auth guard
  app.addHook('preHandler', async (req, reply) => {
    try { await req.jwtVerify() }
    catch { reply.status(401).send({ error: 'Unauthorised' }) }
  })

  // GET /api/account/export — GDPR data export
  app.get('/export', async (req) => {
    const userId = (req.user as { sub: string }).sub
    const [user, devices] = await Promise.all([
      db.query('SELECT email, created_at FROM users WHERE id = $1', [userId]),
      db.query('SELECT name, mac, ip, type, blocked, last_seen FROM devices WHERE user_id = $1', [userId]),
    ])
    return {
      exportedAt: new Date().toISOString(),
      account:    user.rows[0],
      devices:    devices.rows,
    }
  })

  // DELETE /api/account — GDPR right to erasure
  app.delete('/', async (req, reply) => {
    const userId = (req.user as { sub: string }).sub
    // Delete devices first (FK), then user
    await db.query('DELETE FROM devices WHERE user_id = $1', [userId])
    await db.query('DELETE FROM users   WHERE id = $1',      [userId])
    return reply.status(204).send()
  })
}
