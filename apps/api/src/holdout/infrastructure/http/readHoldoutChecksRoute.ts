import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { readHoldoutChecks } from '@mygame/domain'
import { readScaffold } from '#account/application/readScaffold'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import type { LearningDependencies } from '#learning/application/LearningDependencies'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { checksResponse } from './holdoutCheckComponents'
import { respondHoldoutChecks } from './respondHoldoutChecks'

export const readHoldoutChecksDeclaration = createRoute(
  signedInDeclaration({
    method: 'get',
    path: '/',
    responses: {
      200: checksResponse(
        'Every check due at the read, derived from each band’s start: due, or asking its words once begun.',
      ),
    },
  }),
)

export type ReadHoldoutChecksRouteDependencies = LearningDependencies & RequirePlayerDependencies

export const readHoldoutChecksRoute = (
  routes: OpenAPIHono,
  dependencies: ReadHoldoutChecksRouteDependencies,
): void => {
  const { lessons, unitOfWork, clock } = dependencies
  routes.openAPIRegistry.registerPath(readHoldoutChecksDeclaration)
  routes.on(
    readHoldoutChecksDeclaration.method,
    honoPathOf(readHoldoutChecksDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const playerId = c.var.playerId
      const views = await unitOfWork.transact(async (stores) =>
        readHoldoutChecks(
          { playerId, scaffold: await readScaffold(playerId, stores.accounts) },
          { bandStarts: stores.bandStarts, words: lessons, clock },
        ),
      )
      return respondHoldoutChecks(c, views)
    },
  )
}
