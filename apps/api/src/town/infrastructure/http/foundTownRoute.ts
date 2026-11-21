import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { FoundTownSchema } from '@mygame/contracts'
import type { IdGenerator } from '@mygame/domain'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import type { Transaction } from '#platform/application/ports/Transaction'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { type NamedIssue, requestRefusalOf } from '#platform/infrastructure/http/requestRefusalOf'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody } from '#platform/infrastructure/http/responseDeclarations'
import { signedInRoute } from '#platform/infrastructure/http/signedInRoute'
import { foundTownOnFreeSite } from '../../application/foundTownOnFreeSite'
import type { TownStores } from '../../application/ports/TownStores'
import { readTownReading } from '../../application/readTownReading'
import { type RespondTownReadingDependencies, respondTownReading } from './respondTownReading'
import { overviewResponse } from './townComponents'

const foundingIssues: ReadonlyArray<NamedIssue> = [['name', 'too_small', { kind: 'BlankTownName' }]]

export const foundTownDeclaration = createRoute(
  signedInRoute({
    method: 'post',
    path: '/',
    request: { body: jsonBody(FoundTownSchema) },
    responses: {
      200: overviewResponse('The town founded at the lowest free site of region 1.'),
      400: refusalResponse('BlankTownName; any other malformed body answers an empty body.'),
      409: refusalResponse(
        'PlayerAlreadyHoldsTown; a founding that lost its site three times answers an empty body.',
      ),
    },
  }),
)

export type FoundTownRouteDependencies = RequirePlayerDependencies &
  RespondTownReadingDependencies & {
    readonly inTransaction: Transaction<TownStores>
    readonly ids: IdGenerator
  }

export const foundTownRoute = (
  routes: OpenAPIHono,
  dependencies: FoundTownRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(foundTownDeclaration)
  routes.on(
    foundTownDeclaration.method,
    honoPathOf(foundTownDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const request = FoundTownSchema.safeParse(await readJsonBody(c))
      if (!request.success) {
        return respondRefusal(c, requestRefusalOf(foundingIssues, request.error.issues))
      }
      const playerId = c.var.playerId
      const founded = await dependencies.inTransaction(async (stores) => {
        const town = await foundTownOnFreeSite(
          { playerId, name: request.data.name },
          {
            towns: stores.towns,
            skills: stores.earnedSkills,
            catalog: dependencies.townCatalog,
            clock: dependencies.clock,
            ids: dependencies.ids,
          },
        )
        return town.ok
          ? readTownReading(playerId, town.value.storedAt, stores.townsWithSchool)
          : town
      })
      return respondTownReading(c, founded, dependencies)
    },
  )
}
