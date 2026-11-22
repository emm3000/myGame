import { createRoute } from '@hono/zod-openapi'
import { CallJobBackSchema } from '@mygame/contracts'
import { type CallJobBack, Instant } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { malformedResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import {
  type RespondTownReadingDependencies,
  respondTownReading,
} from '../../../infrastructure/http/respondTownReading'
import { overviewResponse, townNotFoundResponse } from '../../../infrastructure/http/townComponents'

export const callJobBackDeclaration = createRoute(
  signedInDeclaration({
    method: 'post',
    path: '/jobs/{sentAt}/call-back',
    request: { params: CallJobBackSchema },
    responses: {
      200: overviewResponse(
        'The town with the team on its way back, its pay cut to the work done before the call.',
      ),
      400: malformedResponse('path'),
      404: townNotFoundResponse,
      409: refusalResponse('JobNotFound or JobAlreadyReturning.'),
    },
  }),
)

export type CallJobBackControllerDependencies = RespondTownReadingDependencies & {
  readonly callJobBack: CallJobBack
}

export class CallJobBackController {
  constructor(private readonly dependencies: CallJobBackControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const request = CallJobBackSchema.safeParse(c.req.param())
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const changed = await this.dependencies.callJobBack.execute({
      playerId: c.var.playerId,
      sentAt: Instant.fromEpochMilliseconds(Date.parse(request.data.sentAt)),
    })
    return respondTownReading(c, changed, this.dependencies)
  }
}
