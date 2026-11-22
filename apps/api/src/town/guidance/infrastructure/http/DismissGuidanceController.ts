import { createRoute } from '@hono/zod-openapi'
import type { DismissGuidance } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { townNotFoundResponse } from '../../../infrastructure/http/townComponents'
import { respondGuidanceChange } from './respondGuidanceChange'

export const dismissGuidanceDeclaration = createRoute(
  signedInDeclaration({
    method: 'post',
    path: '/guidance/dismissal',
    responses: {
      204: { description: 'The town’s guidance is dismissed; no read answers a goal again.' },
      404: townNotFoundResponse,
    },
  }),
)

export type DismissGuidanceControllerDependencies = {
  readonly dismissGuidance: DismissGuidance
}

export class DismissGuidanceController {
  constructor(private readonly dependencies: DismissGuidanceControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    return respondGuidanceChange(c, await this.dependencies.dismissGuidance.execute(c.var.playerId))
  }
}
