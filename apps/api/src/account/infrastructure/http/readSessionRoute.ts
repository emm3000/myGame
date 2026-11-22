import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import type { Accounts } from '@mygame/domain'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import {
  type ReadChromePhaseDependencies,
  readChromePhase,
} from '../../application/readChromePhase'
import { playerResponse } from './accountComponents'
import { presentPlayer } from './presentPlayer'
import { type RequirePlayerDependencies, requirePlayer } from './requirePlayer'

export const readSessionDeclaration = createRoute(
  signedInDeclaration({
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
      return c.json(presentPlayer(player, await readChromePhase(player, dependencies)))
    },
  )
}
