import { EnqueueBuildingRequestSchema, type FiefOverview } from '@mygame/contracts'
import type { DomainError, Fief, Result } from '@mygame/domain'
import { type Context, Hono } from 'hono'
import { type CancelUpgradeDependencies, cancelUpgradeOf } from '../fief/cancelUpgradeOf'
import { type CurrentFiefDependencies, currentFiefOf } from '../fief/currentFiefOf'
import { type EnqueueUpgradeDependencies, enqueueUpgradeOf } from '../fief/enqueueUpgradeOf'
import { fiefOverviewOf } from '../fief/fiefOverviewOf'
import { answerRefusal } from '../http/answerRefusal'
import { bodyOf } from '../http/bodyOf'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'

export type FiefDependencies = CurrentFiefDependencies &
  CancelUpgradeDependencies &
  EnqueueUpgradeDependencies &
  RequirePlayerDependencies

export const fiefRoutes = (dependencies: FiefDependencies): Hono => {
  const answerFief = (c: Context, fief: Result<Fief, DomainError>): Response => {
    if (!fief.ok) {
      return answerRefusal(c, fief.error)
    }
    const overview = fiefOverviewOf(fief.value, dependencies.buildingCatalog)
    if (!overview.ok) {
      return answerRefusal(c, overview.error)
    }
    const body: FiefOverview = overview.value
    return c.json(body)
  }
  const signedInPlayer = requirePlayer(dependencies)
  return new Hono()
    .get('/', signedInPlayer, async (c) =>
      answerFief(c, await currentFiefOf(c.var.playerId, dependencies)),
    )
    .post('/upgrades', signedInPlayer, async (c) => {
      const request = EnqueueBuildingRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(
        c,
        await enqueueUpgradeOf(c.var.playerId, request.data.building, dependencies),
      )
    })
    .delete('/upgrades', signedInPlayer, async (c) =>
      answerFief(c, await cancelUpgradeOf(c.var.playerId, dependencies)),
    )
}
