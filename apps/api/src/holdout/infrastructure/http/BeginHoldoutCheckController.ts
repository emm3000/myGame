import { createRoute } from '@hono/zod-openapi'
import { HoldoutCheckRequestSchema } from '@mygame/contracts'
import type { BeginHoldoutCheck } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { checkNotDue, checkPath, checksResponse, malformedCheck } from './holdoutCheckComponents'
import { respondHoldoutChecks } from './respondHoldoutChecks'

export const beginHoldoutCheckDeclaration = createRoute(
  signedInDeclaration({
    method: 'post',
    path: '/{band}/{week}',
    request: checkPath,
    responses: {
      200: checksResponse(
        'The check begun: the api drew its practised words and asks them beside the held-out ones; a check begun before keeps its words.',
      ),
      400: malformedCheck,
      409: checkNotDue,
    },
  }),
)

export type BeginHoldoutCheckControllerDependencies = {
  readonly beginHoldoutCheck: BeginHoldoutCheck
}

export class BeginHoldoutCheckController {
  constructor(private readonly dependencies: BeginHoldoutCheckControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const check = HoldoutCheckRequestSchema.safeParse(c.req.param())
    if (!check.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const views = await this.dependencies.beginHoldoutCheck.execute({
      playerId: c.var.playerId,
      ...check.data,
    })
    return respondHoldoutChecks(c, views)
  }
}
