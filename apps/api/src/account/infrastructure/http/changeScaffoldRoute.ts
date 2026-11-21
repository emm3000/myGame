import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { ScaffoldChangeSchema } from '@mygame/contracts'
import { answerRefusal } from '../../../platform/infrastructure/http/answerRefusal'
import { readJsonBody } from '../../../platform/infrastructure/http/readJsonBody'
import {
  jsonBody,
  jsonResponse,
  malformedResponse,
} from '../../../platform/infrastructure/http/responseDeclarations'
import { signedInRoute } from '../../../platform/infrastructure/http/signedInRoute'
import type { Accounts } from '../../application/ports/Accounts'
import type { ReadChromePhaseDependencies } from '../../application/readChromePhase'
import { PlayerComponent } from './playerComponent'
import { presentPlayer } from './presentPlayer'
import { type RequirePlayerDependencies, requirePlayer } from './requirePlayer'

const ScaffoldChangeComponent = ScaffoldChangeSchema.meta({ id: 'ScaffoldChange' })

export const changeScaffoldDeclaration = createRoute(
  signedInRoute({
    method: 'put',
    path: '/player/scaffold',
    request: { body: jsonBody(ScaffoldChangeComponent) },
    responses: {
      200: jsonResponse(
        'The player with the scaffold language changed; no card changes.',
        PlayerComponent,
      ),
      400: malformedResponse('body'),
    },
  }),
)

export type ChangeScaffoldRouteDependencies = RequirePlayerDependencies &
  ReadChromePhaseDependencies & {
    readonly accounts: Accounts
  }

export const changeScaffoldRoute = (
  routes: OpenAPIHono,
  dependencies: ChangeScaffoldRouteDependencies,
): void => {
  routes.openAPIRegistry.registerPath(changeScaffoldDeclaration)
  routes.on(
    changeScaffoldDeclaration.method,
    changeScaffoldDeclaration.path,
    requirePlayer(dependencies),
    async (c) => {
      const change = ScaffoldChangeSchema.safeParse(await readJsonBody(c))
      if (!change.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const stored = await dependencies.accounts.storeScaffold(c.var.playerId, change.data.scaffold)
      return c.json(await presentPlayer(stored, dependencies))
    },
  )
}
