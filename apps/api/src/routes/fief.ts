import type { FiefOverview } from '@mygame/contracts'
import { Hono } from 'hono'
import { type CurrentFiefDependencies, currentFiefOf } from '../fief/currentFiefOf'
import { fiefOverviewOf } from '../fief/fiefOverviewOf'
import { answerRefusal } from '../http/answerRefusal'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'

export type FiefDependencies = CurrentFiefDependencies & RequirePlayerDependencies

export const fiefRoutes = (dependencies: FiefDependencies): Hono =>
  new Hono().get('/', requirePlayer(dependencies), async (c) => {
    const fief = await currentFiefOf(c.var.playerId, dependencies)
    if (!fief.ok) {
      return answerRefusal(c, fief.error)
    }
    const overview = fiefOverviewOf(fief.value, dependencies.buildingCatalog)
    if (!overview.ok) {
      return answerRefusal(c, overview.error)
    }
    const body: FiefOverview = overview.value
    return c.json(body)
  })
