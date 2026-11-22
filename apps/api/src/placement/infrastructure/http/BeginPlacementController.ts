import { createRoute } from '@hono/zod-openapi'
import type { BeginPlacement } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { offerRefused, placementResponse } from './placementComponents'
import { respondPlacementView } from './respondPlacementView'

export const beginPlacementDeclaration = createRoute(
  signedInDeclaration({
    method: 'post',
    path: '/',
    responses: {
      200: placementResponse(
        'The placement begun: the api drew each band’s sample and asks band 1.',
      ),
      409: offerRefused,
    },
  }),
)

export type BeginPlacementControllerDependencies = {
  readonly beginPlacement: BeginPlacement
}

export class BeginPlacementController {
  constructor(private readonly dependencies: BeginPlacementControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const view = await this.dependencies.beginPlacement.execute({ playerId: c.var.playerId })
    return respondPlacementView(c, view)
  }
}
