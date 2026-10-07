import type { Digest } from '@mygame/contracts'
import { Hono } from 'hono'
import { type DigestReadDependencies, digestOf } from '../digest/digestOf'
import { answerRefusal } from '../http/answerRefusal'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'

export type DigestDependencies = RequirePlayerDependencies & DigestReadDependencies

export const digestRoutes = (dependencies: DigestDependencies): Hono =>
  new Hono()
    .get('/', requirePlayer(dependencies), async (c) => {
      const digest = await digestOf(c.var.playerId, dependencies)
      if (!digest.ok) {
        return answerRefusal(c, digest.error)
      }
      const body: Digest = digest.value
      return c.json(body)
    })
    .post('/acknowledgement', requirePlayer(dependencies), async (c) => {
      await dependencies.digestAcknowledgements.acknowledge(
        c.var.playerId,
        dependencies.clock.now(),
      )
      return c.body(null, 204)
    })
