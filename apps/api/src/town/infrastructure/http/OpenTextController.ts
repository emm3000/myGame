import { createRoute } from '@hono/zod-openapi'
import { type OpenText, OpenTextSchema, ReadTextRequestSchema } from '@mygame/contracts'
import type { LessonLibrary, ResolveTownForText } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { presentOpenText } from './presentOpenText'

export const openTextDeclaration = createRoute(
  signedInDeclaration({
    method: 'get',
    path: '/texts/{textId}',
    request: { params: ReadTextRequestSchema },
    responses: {
      200: jsonResponse(
        'One text the stage has reached, its sentences as spans, each card word with its support at the read.',
        OpenTextSchema,
      ),
      404: refusalResponse(
        'TownNotFound; a text the stage has not reached, or the content lacks, answers an empty body.',
      ),
    },
  }),
)

export type OpenTextControllerDependencies = {
  readonly resolveTownForText: ResolveTownForText
  readonly lessons: LessonLibrary
}

export class OpenTextController {
  constructor(private readonly dependencies: OpenTextControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const request = ReadTextRequestSchema.safeParse(c.req.param())
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const reading = await this.dependencies.resolveTownForText.execute(c.var.playerId)
    if (!reading.ok) {
      return respondRefusal(c, reading.error)
    }
    const text = presentOpenText(request.data.textId, reading.value, this.dependencies.lessons)
    if (text === undefined) {
      return c.body(null, 404)
    }
    const body: OpenText = text
    return c.json(body)
  }
}
