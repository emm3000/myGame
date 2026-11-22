import { createRoute } from '@hono/zod-openapi'
import type { ReadPlacement } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { placementResponse } from './placementComponents'
import { respondPlacementView } from './respondPlacementView'

export const readPlacementDeclaration = createRoute(
  signedInDeclaration({
    method: 'get',
    path: '/',
    responses: {
      200: placementResponse(
        'The placement offered, the band it asks with its words and choices, or the stored scores once it is closed.',
      ),
    },
  }),
)

export type ReadPlacementControllerDependencies = {
  readonly readPlacement: ReadPlacement
}

export class ReadPlacementController {
  constructor(private readonly dependencies: ReadPlacementControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const view = await this.dependencies.readPlacement.execute({ playerId: c.var.playerId })
    return respondPlacementView(c, view)
  }
}
