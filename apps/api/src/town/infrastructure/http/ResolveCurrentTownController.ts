import { createRoute } from '@hono/zod-openapi'
import type { ResolveCurrentTown } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { type RespondTownReadingDependencies, respondTownOverview } from './respondTownReading'
import { overviewResponse, townNotFoundResponse } from './townComponents'

export const resolveCurrentTownDeclaration = createRoute(
  signedInDeclaration({
    method: 'get',
    path: '/',
    responses: {
      200: overviewResponse(
        'The player’s town, accrued to the read, with every finished work applied.',
      ),
      404: townNotFoundResponse,
    },
  }),
)

export type ResolveCurrentTownControllerDependencies = RespondTownReadingDependencies & {
  readonly resolveCurrentTown: ResolveCurrentTown
}

export class ResolveCurrentTownController {
  constructor(private readonly dependencies: ResolveCurrentTownControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const reading = await this.dependencies.resolveCurrentTown.execute(c.var.playerId)
    return respondTownOverview(c, reading, this.dependencies)
  }
}
