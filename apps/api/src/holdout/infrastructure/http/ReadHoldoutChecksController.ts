import { createRoute } from '@hono/zod-openapi'
import type { ReadHoldoutChecks } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { checksResponse } from './holdoutCheckComponents'
import { respondHoldoutChecks } from './respondHoldoutChecks'

export const readHoldoutChecksDeclaration = createRoute(
  signedInDeclaration({
    method: 'get',
    path: '/',
    responses: {
      200: checksResponse(
        'Every check due at the read, derived from each band’s start: due, or asking its words once begun.',
      ),
    },
  }),
)

export type ReadHoldoutChecksControllerDependencies = {
  readonly readHoldoutChecks: ReadHoldoutChecks
}

export class ReadHoldoutChecksController {
  constructor(private readonly dependencies: ReadHoldoutChecksControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const views = await this.dependencies.readHoldoutChecks.execute({ playerId: c.var.playerId })
    return respondHoldoutChecks(c, views)
  }
}
