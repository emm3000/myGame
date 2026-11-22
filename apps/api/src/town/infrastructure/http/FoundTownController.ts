import { createRoute } from '@hono/zod-openapi'
import { FoundTownSchema } from '@mygame/contracts'
import type { FoundTown } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { type NamedIssue, requestRefusalOf } from '#platform/infrastructure/http/requestRefusalOf'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { type RespondTownReadingDependencies, respondTownReading } from './respondTownReading'
import { overviewResponse } from './townComponents'

const foundingIssues: ReadonlyArray<NamedIssue> = [['name', 'too_small', { kind: 'BlankTownName' }]]

export const foundTownDeclaration = createRoute(
  signedInDeclaration({
    method: 'post',
    path: '/',
    request: { body: jsonBody(FoundTownSchema) },
    responses: {
      200: overviewResponse('The town founded at the lowest free site of region 1.'),
      400: refusalResponse('BlankTownName; any other malformed body answers an empty body.'),
      409: refusalResponse(
        'PlayerAlreadyHoldsTown; a founding that lost its site three times answers an empty body.',
      ),
    },
  }),
)

export type FoundTownControllerDependencies = RespondTownReadingDependencies & {
  readonly foundTown: FoundTown
}

export class FoundTownController {
  constructor(private readonly dependencies: FoundTownControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const request = FoundTownSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return respondRefusal(c, requestRefusalOf(foundingIssues, request.error.issues))
    }
    const founded = await this.dependencies.foundTown.execute({
      playerId: c.var.playerId,
      name: request.data.name,
    })
    return respondTownReading(c, founded, this.dependencies)
  }
}
