import { createRoute } from '@hono/zod-openapi'
import { ScaffoldChangeSchema } from '@mygame/contracts'
import type { Accounts, ReadChromePhase } from '@mygame/domain'
import type { Context } from 'hono'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import {
  jsonBody,
  jsonResponse,
  malformedResponse,
} from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { PlayerComponent } from './playerComponent'
import { presentPlayer } from './presentPlayer'
import type { SignedInPlayer } from './requirePlayer'

const ScaffoldChangeComponent = ScaffoldChangeSchema.meta({ id: 'ScaffoldChange' })

export const changeScaffoldDeclaration = createRoute(
  signedInDeclaration({
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

export type ChangeScaffoldControllerDependencies = {
  readonly accounts: Accounts
  readonly readChromePhase: ReadChromePhase
}

export class ChangeScaffoldController {
  constructor(private readonly dependencies: ChangeScaffoldControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const change = ScaffoldChangeSchema.safeParse(await readJsonBody(c))
    if (!change.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const { accounts, readChromePhase } = this.dependencies
    const stored = await accounts.storeScaffold(c.var.playerId, change.data.scaffold)
    return c.json(presentPlayer(stored, await readChromePhase.execute(stored)))
  }
}
