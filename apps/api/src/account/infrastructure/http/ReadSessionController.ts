import { createRoute } from '@hono/zod-openapi'
import type { Accounts, ReadChromePhase } from '@mygame/domain'
import type { Context } from 'hono'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { playerResponse } from './accountComponents'
import { presentPlayer } from './presentPlayer'
import type { SignedInPlayer } from './requirePlayer'

export const readSessionDeclaration = createRoute(
  signedInDeclaration({
    method: 'get',
    path: '/auth/session',
    responses: {
      200: playerResponse('The signed-in player; the session is renewed.'),
    },
  }),
)

export type ReadSessionControllerDependencies = {
  readonly accounts: Accounts
  readonly readChromePhase: ReadChromePhase
}

export class ReadSessionController {
  constructor(private readonly dependencies: ReadSessionControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const player = await this.dependencies.accounts.playerOf(c.var.playerId)
    if (player === undefined) {
      return respondRefusal(c, { kind: 'SignedOut' })
    }
    const chromePhase = await this.dependencies.readChromePhase.execute(player)
    if (!chromePhase.ok) {
      return respondRefusal(c, chromePhase.error)
    }
    return c.json(presentPlayer(player, chromePhase.value))
  }
}
