import { FiefRequestSchema } from '@mygame/contracts'
import type { FiefOfPlayer } from '@mygame/domain'
import { createMiddleware } from 'hono/factory'
import type { MiddlewareHandler } from 'hono/types'
import { answerRefusal } from './answerRefusal'
import type { SignedInPlayer } from './requirePlayer'

export type NamedFief = {
  readonly Variables: SignedInPlayer['Variables'] & {
    readonly fiefOfPlayer: FiefOfPlayer
  }
}

export const requireNamedFief: MiddlewareHandler<NamedFief> = createMiddleware<NamedFief>(
  async (c, next) => {
    const request = FiefRequestSchema.safeParse(c.req.param())
    if (!request.success) {
      return answerRefusal(c, { kind: 'MalformedRequest' })
    }
    c.set('fiefOfPlayer', { playerId: c.var.playerId, fiefId: request.data.fiefId })
    await next()
  },
)
