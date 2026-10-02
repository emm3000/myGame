import type { FiefOfPlayer } from '@mygame/domain'
import { createMiddleware } from 'hono/factory'
import type { MiddlewareHandler } from 'hono/types'
import type { FiefReader } from '../fief/FiefReader'
import { answerRefusal } from './answerRefusal'
import type { SignedInPlayer } from './requirePlayer'

export type SoleFief = {
  readonly Variables: SignedInPlayer['Variables'] & {
    readonly fiefOfPlayer: FiefOfPlayer
  }
}

export type RequireSoleFiefDependencies = {
  readonly fiefs: Pick<FiefReader, 'fiefsOf'>
}

// TODO(#382) the /fiefs/:fiefId routes name the fief and replace this lookup
export const requireSoleFief = ({
  fiefs,
}: RequireSoleFiefDependencies): MiddlewareHandler<SoleFief> =>
  createMiddleware<SoleFief>(async (c, next) => {
    const playerId = c.var.playerId
    const [fiefId] = await fiefs.fiefsOf(playerId)
    if (fiefId === undefined) {
      return answerRefusal(c, { kind: 'NoFiefHeld' })
    }
    c.set('fiefOfPlayer', { playerId, fiefId })
    await next()
  })
