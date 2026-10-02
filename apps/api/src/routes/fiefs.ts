import type { FiefList } from '@mygame/contracts'
import { Hono } from 'hono'
import { fiefListOf } from '../fief/fiefListOf'
import { answerRefusal } from '../http/answerRefusal'
import { requirePlayer } from '../http/requirePlayer'
import { type FiefDependencies, fiefRoutes } from './fief'
import { type MapDependencies, mapRoutes } from './map'

export type FiefsDependencies = FiefDependencies & MapDependencies

export const fiefsRoutes = (dependencies: FiefsDependencies): Hono =>
  new Hono()
    .get('/', requirePlayer(dependencies), async (c) => {
      const fiefs = await fiefListOf(c.var.playerId, dependencies)
      if (!fiefs.ok) {
        return answerRefusal(c, fiefs.error)
      }
      const body: FiefList = fiefs.value
      return c.json(body)
    })
    .route('/:fiefId/map', mapRoutes(dependencies))
    .route('/:fiefId', fiefRoutes(dependencies))
