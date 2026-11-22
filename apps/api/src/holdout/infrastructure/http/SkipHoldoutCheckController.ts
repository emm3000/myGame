import { createRoute } from '@hono/zod-openapi'
import { HoldoutCheckRequestSchema } from '@mygame/contracts'
import type { SkipHoldoutCheck } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { checkNotDue, checkPath, checksResponse, malformedCheck } from './holdoutCheckComponents'
import { respondHoldoutChecks } from './respondHoldoutChecks'

export const skipHoldoutCheckDeclaration = createRoute(
  signedInDeclaration({
    method: 'post',
    path: '/{band}/{week}/skip',
    request: checkPath,
    responses: {
      200: checksResponse(
        'The check skipped for good; a skipped 24-week check releases the band’s held-out words.',
      ),
      400: malformedCheck,
      409: checkNotDue,
    },
  }),
)

export type SkipHoldoutCheckControllerDependencies = {
  readonly skipHoldoutCheck: SkipHoldoutCheck
}

export class SkipHoldoutCheckController {
  constructor(private readonly dependencies: SkipHoldoutCheckControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const check = HoldoutCheckRequestSchema.safeParse(c.req.param())
    if (!check.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const views = await this.dependencies.skipHoldoutCheck.execute({
      playerId: c.var.playerId,
      ...check.data,
    })
    return respondHoldoutChecks(c, views)
  }
}
