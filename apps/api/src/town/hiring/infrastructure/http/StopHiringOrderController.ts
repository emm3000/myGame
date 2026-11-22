import { createRoute } from '@hono/zod-openapi'
import { StopHiringOrderSchema } from '@mygame/contracts'
import { Instant, type StopHiringOrder } from '@mygame/domain'
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

export const stopHiringOrderDeclaration = createRoute(
  signedInDeclaration({
    method: 'delete',
    path: '/hiring/{hire}/{startedAt}',
    request: { params: StopHiringOrderSchema },
    responses: {
      200: overviewResponse(
        'The town with the hiring order stopped: the delivered hires kept, the rest refunded in full.',
      ),
      400: malformedResponse('path'),
      404: townNotFoundResponse,
      409: refusalResponse('HiringOrderNotFound.'),
    },
  }),
)

export type StopHiringOrderControllerDependencies = RespondTownReadingDependencies & {
  readonly stopHiringOrder: StopHiringOrder
}

export class StopHiringOrderController {
  constructor(private readonly dependencies: StopHiringOrderControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const request = StopHiringOrderSchema.safeParse(c.req.param())
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const { hire, startedAt } = request.data
    const changed = await this.dependencies.stopHiringOrder.execute({
      playerId: c.var.playerId,
      hire,
      startedAt: Instant.fromEpochMilliseconds(Date.parse(startedAt)),
    })
    return respondTownReading(c, changed, this.dependencies)
  }
}
