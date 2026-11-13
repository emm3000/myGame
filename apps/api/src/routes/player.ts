import { OpenAPIHono } from '@hono/zod-openapi'
import { ScaffoldChangeSchema } from '@mygame/contracts'
import type { Accounts } from '../auth/Accounts'
import { answerRefusal } from '../http/answerRefusal'
import { bodyOf } from '../http/bodyOf'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'
import type { PlayerChromePhaseDependencies } from '../learning/playerChromePhaseOf'
import { playerBodyOf } from './playerBodyOf'
import { playerDeclarations } from './playerDeclarations'

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
      const change = ScaffoldChangeSchema.safeParse(await bodyOf(c))
      if (!change.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const stored = await dependencies.accounts.storeScaffold(c.var.playerId, change.data.scaffold)
      return c.json(await playerBodyOf(stored, dependencies))
    },
  )
  return routes
}
