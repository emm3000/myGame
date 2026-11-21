import { OpenAPIHono } from '@hono/zod-openapi'
import { ScaffoldChangeSchema } from '@mygame/contracts'
import { answerRefusal } from '../../../platform/infrastructure/http/answerRefusal'
import { readJsonBody } from '../../../platform/infrastructure/http/readJsonBody'
import type { Accounts } from '../../application/ports/Accounts'
import type { PlayerChromePhaseDependencies } from '../../application/readChromePhase'
import { playerDeclarations } from './playerDeclarations'
import { playerBodyOf } from './presentPlayer'
import { type RequirePlayerDependencies, requirePlayer } from './requirePlayer'

export type PlayerRouteDependencies = RequirePlayerDependencies &
  PlayerChromePhaseDependencies & {
    readonly accounts: Accounts
  }

export const playerRoutes = (dependencies: PlayerRouteDependencies): OpenAPIHono => {
  const signedInPlayer = requirePlayer(dependencies)
  const routes = new OpenAPIHono()
  for (const declaration of Object.values(playerDeclarations)) {
    routes.openAPIRegistry.registerPath(declaration)
  }
  routes.on(
    playerDeclarations.changeScaffold.method,
    playerDeclarations.changeScaffold.path,
    signedInPlayer,
    async (c) => {
      const change = ScaffoldChangeSchema.safeParse(await readJsonBody(c))
      if (!change.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const stored = await dependencies.accounts.storeScaffold(c.var.playerId, change.data.scaffold)
      return c.json(await playerBodyOf(stored, dependencies))
    },
  )
  return routes
}
