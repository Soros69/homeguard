import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client.js'

// Middleware: verify JWT on every route in this plugin
async function requireAuth(app: FastifyInstance) {
  app.addHook('preHandler', async (req, reply) => {
    try { await req.jwtVerify() }
    catch { reply.status(401).send({ error: 'Unauthorised' }) }
  })
}

export default async function deviceRoutes(app: FastifyInstance) {
  await requireAuth(app)

  // GET /api/devices — list all devices for this user's household
  app.get('/', async (req) => {
    const userId = (req.user as { sub: string }).sub
    const result = await db.query(
      `SELECT id, name, mac, ip, blocked, last_seen, type
       FROM devices WHERE user_id = $1 ORDER BY blocked, name`,
      [userId]
    )
    return result.rows.map(r => ({
      id:       r.id,
      name:     r.name,
      mac:      r.mac,
      ip:       r.ip,
      blocked:  r.blocked,
      lastSeen: r.last_seen,
      type:     r.type,
    }))
  })

  // PATCH /api/devices/:id — block or unblock a device
  app.patch('/:id', async (req, reply) => {
    const userId = (req.user as { sub: string }).sub
    const { id } = req.params as { id: string }
    const body   = z.object({ blocked: z.boolean() }).safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

    // Ensure the device belongs to this user (prevents IDOR)
    const result = await db.query(
      `UPDATE devices SET blocked = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3 RETURNING id, blocked`,
      [body.data.blocked, id, userId]
    )
    if (!result.rows[0]) return reply.status(404).send({ error: 'Device not found' })

    // TODO: send command to the local agent to apply/remove the router rule
    // await agentClient.setBlock(result.rows[0].mac, body.data.blocked)

    return result.rows[0]
  })
}
