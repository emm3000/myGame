import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { SendJobSchema } from '@mygame/contracts'
import { ok, sendJob } from '@mygame/domain'
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

export const sendJobDeclaration = createRoute(
  signedInRoute({
    method: 'post',
    path: '/jobs',
    request: { body: jsonBody(SendJobSchema) },
    responses: {
      200: overviewResponse('The town with the team out on the job, its pay fixed at dispatch.'),
      400: refusalResponse(
        'InvalidTeam, JobHoursOutOfRange or JobSiteOutOfBounds; any other malformed body answers an empty body.',
      ),
      404: townNotFoundResponse,
      409: refusalResponse('TeamAlreadyOut, JobToOwnSite, SiteHeld or NotEnoughHiresAtHome.'),
    },
  }),
)

export type SendJobRouteDependencies = RequirePlayerDependencies & AnswerTownChangeDependencies

export const sendJobRoute = (routes: OpenAPIHono, dependencies: SendJobRouteDependencies): void => {
  routes.openAPIRegistry.registerPath(sendJobDeclaration)
  routes.on(
    sendJobDeclaration.method,
    honoPathOf(sendJobDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const request = SendJobSchema.safeParse(await readJsonBody(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      return answerTownChange(
        c,
        playerId,
        async (stores, clock) => {
          const town = await sendJob(
            { playerId, ...request.data },
            {
              towns: stores.towns,
              map: stores.regionMap,
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
