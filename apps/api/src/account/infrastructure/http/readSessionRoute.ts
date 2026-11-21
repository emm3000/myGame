import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { signedInRoute } from '#platform/infrastructure/http/signedInDeclaration'
import type { Accounts } from '../../application/ports/Accounts'
import type { ReadChromePhaseDependencies } from '../../application/readChromePhase'
import { playerResponse } from './accountComponents'
import { presentPlayer } from './presentPlayer'
import { type RequirePlayerDependencies, requirePlayer } from './requirePlayer'

export const readSessionDeclaration = createRoute(
  signedInRoute({
    method: 'get',
    path: '/auth/session',
    responses: {
      200: playerResponse('The signed-in player; the session is renewed.'),
    },
  }),
)

export type ReadSessionRouteDependencies = RequirePlayerDependencies &
  ReadChromePhaseDependencies & {
    readonly accounts: Accounts
  }

export const readSessionRoute = (
  routes: OpenAPIHono,
  dependencies: ReadSessionRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(readSessionDeclaration)
  routes.on(
    readSessionDeclaration.method,
    readSessionDeclaration.path,
    requirePlayer(dependencies),
    async (c) => {
      const player = await dependencies.accounts.playerOf(c.var.playerId)
      if (player === undefined) {
        return respondRefusal(c, { kind: 'SignedOut' })
      }
      return c.json(await presentPlayer(player, dependencies))
    },
  )
}
