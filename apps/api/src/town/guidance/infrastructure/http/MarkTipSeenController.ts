import { createRoute } from '@hono/zod-openapi'
import { MarkTipSeenSchema } from '@mygame/contracts'
import type { MarkTipSeen } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { malformedResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { respondGuidanceChange } from './respondGuidanceChange'

export const markTipSeenDeclaration = createRoute(
  signedInDeclaration({
    method: 'post',
    path: '/tips/{tip}',
    request: { params: MarkTipSeenSchema },
    responses: {
      204: { description: 'The tip is marked seen; marking it again changes nothing.' },
      400: malformedResponse('tip'),
    },
  }),
)

export type MarkTipSeenControllerDependencies = {
  readonly markTipSeen: MarkTipSeen
}

export class MarkTipSeenController {
  constructor(private readonly dependencies: MarkTipSeenControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const request = MarkTipSeenSchema.safeParse(c.req.param())
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const marked = await this.dependencies.markTipSeen.execute({
      playerId: c.var.playerId,
      tip: request.data.tip,
    })
    return respondGuidanceChange(c, marked)
  }
}
