import { Hono } from 'hono'
import type { DigestAcknowledgements } from '../digest/DigestAcknowledgements'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'

export type DigestDependencies = RequirePlayerDependencies & {
  readonly digestAcknowledgements: DigestAcknowledgements
}

export const digestRoutes = (dependencies: DigestDependencies): Hono =>
  new Hono().post('/acknowledgement', requirePlayer(dependencies), async (c) => {
    await dependencies.digestAcknowledgements.acknowledge(c.var.playerId, dependencies.clock.now())
    return c.body(null, 204)
  })
