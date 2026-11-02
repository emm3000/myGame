import { OpenAPIHono } from '@hono/zod-openapi'
import type { FiefList } from '@mygame/contracts'
import { fiefListOf } from '../fief/fiefListOf'
import { answerRefusal } from '../http/answerRefusal'
import { requirePlayer } from '../http/requirePlayer'
import { honoPathOf } from '../http/responseDeclarations'
import { type FiefDependencies, fiefRoutes } from './fief'
import { fiefsDeclarations } from './fiefsDeclarations'
import { type MapDependencies, mapRoutes } from './map'

export type FiefsDependencies = FiefDependencies & MapDependencies

export const fiefsRoutes = (dependencies: FiefsDependencies): OpenAPIHono => {
  const routes = new OpenAPIHono()
  routes.openAPIRegistry.registerPath(fiefsDeclarations.list)
  routes.on(
    fiefsDeclarations.list.method,
    honoPathOf(fiefsDeclarations.list),
    requirePlayer(dependencies),
    async (c) => {
      const fiefs = await fiefListOf(c.var.playerId, dependencies)
      if (!fiefs.ok) {
        return answerRefusal(c, fiefs.error)
      }
      const body: FiefList = fiefs.value
      return c.json(body)
    },
  )
  routes.route('/:fiefId/map', mapRoutes(dependencies))
  routes.route('/:fiefId', fiefRoutes(dependencies))
  return routes
}
