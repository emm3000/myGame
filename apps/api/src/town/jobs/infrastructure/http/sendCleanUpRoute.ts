import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { SendCleanUpSchema } from '@mygame/contracts'
import { ok, sendCleanUp } from '@mygame/domain'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { answerRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody } from '#platform/infrastructure/http/responseDeclarations'
import { signedInRoute } from '#platform/infrastructure/http/signedInRoute'
import {
  type AnswerTownChangeDependencies,
  answerTownChange,
} from '../../../infrastructure/http/respondTownChange'
import { overviewResponse, townNotFoundResponse } from '../../../infrastructure/http/townComponents'

export const sendCleanUpDeclaration = createRoute(
  signedInRoute({
    method: 'post',
    path: '/clean-ups',
    request: { body: jsonBody(SendCleanUpSchema) },
    responses: {
      200: overviewResponse(
        'The town with the team out on the clean-up, its pay fixed at dispatch: none when its strength falls short of the waste.',
      ),
      400: refusalResponse(
        'InvalidTeam or JobSiteOutOfBounds; any other malformed body answers an empty body.',
      ),
      404: townNotFoundResponse,
      409: refusalResponse(
        'TeamAlreadyOut, JobToOwnSite, SiteHeld, NotAWasteSite, NoWasteYet or NotEnoughHiresAtHome.',
      ),
    },
  }),
)

export type SendCleanUpRouteDependencies = RequirePlayerDependencies & AnswerTownChangeDependencies

export const sendCleanUpRoute = (
  routes: OpenAPIHono,
  dependencies: SendCleanUpRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(sendCleanUpDeclaration)
  routes.on(
    sendCleanUpDeclaration.method,
    honoPathOf(sendCleanUpDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const request = SendCleanUpSchema.safeParse(await readJsonBody(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      return answerTownChange(
        c,
        playerId,
        async (stores, clock) => {
          const town = await sendCleanUp(
            { playerId, ...request.data },
            {
              towns: stores.towns,
              map: stores.regionMap,
              cleanUps: stores.cleanUps,
              news: stores.townNews,
              catalog: dependencies.townCatalog,
              clock,
            },
          )
          return town.ok ? ok(clock.now()) : town
        },
        dependencies,
      )
    },
  )
}
