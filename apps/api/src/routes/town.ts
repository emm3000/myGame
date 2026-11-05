import { OpenAPIHono } from '@hono/zod-openapi'
import {
  FoundTownSchema,
  StartBuildingWorkSchema,
  StopBuildingWorkSchema,
  type TownOverview,
} from '@mygame/contracts/town'
import { type DomainError, type IdGenerator, ok, type Result } from '@mygame/domain'
import { startBuildingWork, stopBuildingWork, type Town } from '@mygame/domain/town'
import type { Context } from 'hono'
import { answerRefusal } from '../http/answerRefusal'
import { bodyOf } from '../http/bodyOf'
import { honoPathOf } from '../http/honoPath'
import { type NamedIssue, requestRefusalOf } from '../http/requestRefusalOf'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'
import { type CurrentTownDependencies, currentTownOf } from '../town/currentTownOf'
import { foundTownOnFreeSite } from '../town/foundTownOnFreeSite'
import { mutateTown } from '../town/mutateTown'
import type { TownReading } from '../town/TownReading'
import { townOverviewOf } from '../town/townOverviewOf'
import { townDeclarations } from './townDeclarations'

const foundingIssues: ReadonlyArray<NamedIssue> = [['name', 'too_small', { kind: 'BlankTownName' }]]

export type TownDependencies = CurrentTownDependencies &
  RequirePlayerDependencies & {
    readonly ids: IdGenerator
  }

export const townRoutes = (dependencies: TownDependencies): OpenAPIHono => {
  const { townCatalog: catalog } = dependencies
  const answerReading = (c: Context, reading: Result<TownReading, DomainError>): Response => {
    if (!reading.ok) {
      return answerRefusal(c, reading.error)
    }
    const overview = townOverviewOf(reading.value, catalog)
    if (!overview.ok) {
      return answerRefusal(c, overview.error)
    }
    const body: TownOverview = overview.value
    return c.json(body)
  }
  const answerTown = (c: Context, town: Result<Town, DomainError>): Response =>
    answerReading(c, town.ok ? ok({ town: town.value, at: town.value.storedAt }) : town)
  const signedInPlayer = requirePlayer(dependencies)
  const routes = new OpenAPIHono()
  for (const declaration of Object.values(townDeclarations)) {
    routes.openAPIRegistry.registerPath(declaration)
  }
  routes.on(
    townDeclarations.overview.method,
    honoPathOf(townDeclarations.overview),
    signedInPlayer,
    async (c) => answerReading(c, await currentTownOf(c.var.playerId, dependencies)),
  )
  routes.on(
    townDeclarations.found.method,
    honoPathOf(townDeclarations.found),
    signedInPlayer,
    async (c) => {
      const request = FoundTownSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, requestRefusalOf(foundingIssues, request.error.issues))
      }
      const founded = await dependencies.inTransaction(({ towns }) =>
        foundTownOnFreeSite(
          { playerId: c.var.playerId, name: request.data.name },
          { towns, catalog, clock: dependencies.clock, ids: dependencies.ids },
        ),
      )
      return answerTown(c, founded)
    },
  )
  routes.on(
    townDeclarations.startWork.method,
    honoPathOf(townDeclarations.startWork),
    signedInPlayer,
    async (c) => {
      const request = StartBuildingWorkSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const started = await mutateTown(
        playerId,
        ({ towns, townNews }, clock) =>
          startBuildingWork(
            { playerId, building: request.data.building },
            { towns, news: townNews, catalog, clock },
          ),
        dependencies,
      )
      return answerTown(c, started)
    },
  )
  routes.on(
    townDeclarations.stopWork.method,
    honoPathOf(townDeclarations.stopWork),
    signedInPlayer,
    async (c) => {
      const request = StopBuildingWorkSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const stopped = await mutateTown(
        playerId,
        async ({ towns, townNews }, clock) => {
          const change = await stopBuildingWork(
            { playerId, ...request.data },
            { towns, news: townNews, catalog, clock },
          )
          return change.ok ? ok(change.value.town) : change
        },
        dependencies,
      )
      return answerTown(c, stopped)
    },
  )
  return routes
}
