import { createRoute } from '@hono/zod-openapi'
import type { SkipPlacement } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { offerRefused, placementResponse } from './placementComponents'
import { respondPlacementView } from './respondPlacementView'

export const skipPlacementDeclaration = createRoute(
  signedInDeclaration({
    method: 'post',
    path: '/skip',
    responses: {
      200: placementResponse('The placement skipped for good; the player starts at lesson 1.'),
      409: offerRefused,
    },
  }),
)

export type SkipPlacementControllerDependencies = {
  readonly skipPlacement: SkipPlacement
}

export class SkipPlacementController {
  constructor(private readonly dependencies: SkipPlacementControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const view = await this.dependencies.skipPlacement.execute({ playerId: c.var.playerId })
    return respondPlacementView(c, view)
  }
}
