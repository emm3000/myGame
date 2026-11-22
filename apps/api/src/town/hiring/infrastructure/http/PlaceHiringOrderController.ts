import { createRoute } from '@hono/zod-openapi'
import { PlaceHiringOrderSchema } from '@mygame/contracts'
import type { PlaceHiringOrder } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody, malformedResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import {
  type RespondTownReadingDependencies,
  respondTownReading,
} from '../../../infrastructure/http/respondTownReading'
import { overviewResponse, townNotFoundResponse } from '../../../infrastructure/http/townComponents'

export const placeHiringOrderDeclaration = createRoute(
  signedInDeclaration({
    method: 'post',
    path: '/hiring',
    request: { body: jsonBody(PlaceHiringOrderSchema) },
    responses: {
      200: overviewResponse('The town with the hiring order placed, paid and staffed in full.'),
      400: malformedResponse('body'),
      404: townNotFoundResponse,
      409: refusalResponse('OfficeTooLow, HiringSlotBusy, NotEnoughPeople or NotEnoughResources.'),
    },
  }),
)

export type PlaceHiringOrderControllerDependencies = RespondTownReadingDependencies & {
  readonly placeHiringOrder: PlaceHiringOrder
}

export class PlaceHiringOrderController {
  constructor(private readonly dependencies: PlaceHiringOrderControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const request = PlaceHiringOrderSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const changed = await this.dependencies.placeHiringOrder.execute({
      playerId: c.var.playerId,
      ...request.data,
    })
    return respondTownReading(c, changed, this.dependencies)
  }
}
