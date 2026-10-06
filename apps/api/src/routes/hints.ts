import { HintKindSchema } from '@mygame/contracts'
import { Hono } from 'hono'
import type { SeenHints } from '../hint/SeenHints'
import { answerRefusal } from '../http/answerRefusal'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'

export type HintsDependencies = RequirePlayerDependencies & {
  readonly seenHints: SeenHints
}

export const hintsRoutes = (dependencies: HintsDependencies): Hono =>
  new Hono().post('/:hint', requirePlayer(dependencies), async (c) => {
    const hint = HintKindSchema.safeParse(c.req.param('hint'))
    if (!hint.success) {
      return answerRefusal(c, { kind: 'MalformedRequest' })
    }
    await dependencies.seenHints.markSeen(c.var.playerId, hint.data)
    return c.body(null, 204)
  })
