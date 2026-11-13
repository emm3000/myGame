import { OpenAPIHono } from '@hono/zod-openapi'
import { type Placement, PlacementAnswersSchema } from '@mygame/contracts'
import {
  answerPlacement,
  beginPlacement,
  type DomainError,
  type PlacementView,
  type RandomSource,
  type Result,
  readPlacement,
  skipPlacement,
} from '@mygame/domain'
import type { Context } from 'hono'
import { answerRefusal } from '../http/answerRefusal'
import { bodyOf } from '../http/bodyOf'
import { honoPathOf } from '../http/honoPath'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'
import type { LearningDependencies } from '../learning/LearningDependencies'
import { placementBodyOf } from '../learning/placementBodyOf'
import { scaffoldOf } from '../learning/scaffoldOf'
import { mutateTown } from '../town/mutateTown'
import { placementDeclarations } from './placementDeclarations'

export type PlacementRouteDependencies = LearningDependencies &
  RequirePlayerDependencies & {
    readonly random: RandomSource
  }

const answerPlacementView = (c: Context, view: Result<PlacementView, DomainError>): Response => {
  if (!view.ok) {
    return answerRefusal(c, view.error)
  }
  const body: Placement = placementBodyOf(view.value)
  return c.json(body)
}

export const placementRoutes = (dependencies: PlacementRouteDependencies): OpenAPIHono => {
  const signedInPlayer = requirePlayer(dependencies)
  const { lessons, random } = dependencies
  const content = { words: lessons, bands: lessons }
  const routes = new OpenAPIHono()
  for (const declaration of Object.values(placementDeclarations)) {
    routes.openAPIRegistry.registerPath(declaration)
  }
  routes.on(
    placementDeclarations.readPlacement.method,
    honoPathOf(placementDeclarations.readPlacement),
    signedInPlayer,
    async (c) => {
      const playerId = c.var.playerId
      const view = await mutateTown(
        playerId,
        async (stores) =>
          readPlacement(
            { playerId, scaffold: await scaffoldOf(playerId, stores.accounts) },
            { ...stores, ...content },
          ),
        dependencies,
      )
      return answerPlacementView(c, view)
    },
  )
  routes.on(
    placementDeclarations.beginPlacement.method,
    honoPathOf(placementDeclarations.beginPlacement),
    signedInPlayer,
    async (c) => {
      const playerId = c.var.playerId
      const view = await mutateTown(
        playerId,
        async (stores, clock) => {
          const begun = await beginPlacement({ playerId }, { ...stores, ...content, random, clock })
          const scaffold = await scaffoldOf(playerId, stores.accounts)
          return begun.ok ? readPlacement({ playerId, scaffold }, { ...stores, ...content }) : begun
        },
        dependencies,
      )
      return answerPlacementView(c, view)
    },
  )
  routes.on(
    placementDeclarations.skipPlacement.method,
    honoPathOf(placementDeclarations.skipPlacement),
    signedInPlayer,
    async (c) => {
      const playerId = c.var.playerId
      const view = await mutateTown(
        playerId,
        async (stores, clock) => {
          const skipped = await skipPlacement({ playerId }, { ...stores, ...content, clock })
          const scaffold = await scaffoldOf(playerId, stores.accounts)
          return skipped.ok
            ? readPlacement({ playerId, scaffold }, { ...stores, ...content })
            : skipped
        },
        dependencies,
      )
      return answerPlacementView(c, view)
    },
  )
  routes.on(
    placementDeclarations.answerPlacement.method,
    honoPathOf(placementDeclarations.answerPlacement),
    signedInPlayer,
    async (c) => {
      const request = PlacementAnswersSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      const view = await mutateTown(
        playerId,
        async (stores, clock) =>
          answerPlacement(
            {
              playerId,
              band: request.data.band,
              answers: request.data.answers,
              scaffold: await scaffoldOf(playerId, stores.accounts),
            },
            { ...stores, ...content, clock },
          ),
        dependencies,
      )
      return answerPlacementView(c, view)
    },
  )
  return routes
}
