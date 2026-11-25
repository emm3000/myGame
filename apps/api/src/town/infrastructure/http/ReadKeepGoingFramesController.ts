import { createRoute } from '@hono/zod-openapi'
import { type KeepGoingFrames, KeepGoingFramesSchema } from '@mygame/contracts'
import type { LessonLibrary, MemoryTerms, ResolveTownForReading } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { presentKeepGoingFrames } from './presentKeepGoingFrames'

export const readKeepGoingFramesDeclaration = createRoute(
  signedInDeclaration({
    method: 'get',
    path: '/frames',
    responses: {
      200: jsonResponse(
        'The frames Keep going offers: each reviewed word whose next review is the content’s line or more away, soonest due first, at most the content’s cap, each frame as spans with its card words supported at the read. The read writes nothing.',
        KeepGoingFramesSchema,
      ),
      404: refusalResponse('TownNotFound.'),
    },
  }),
)

export type ReadKeepGoingFramesControllerDependencies = {
  readonly resolveTownForReading: ResolveTownForReading
  readonly lessons: LessonLibrary
  readonly memoryTerms: MemoryTerms
}

export class ReadKeepGoingFramesController {
  constructor(private readonly dependencies: ReadKeepGoingFramesControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const reading = await this.dependencies.resolveTownForReading.execute(c.var.playerId)
    if (!reading.ok) {
      return respondRefusal(c, reading.error)
    }
    const frames = presentKeepGoingFrames(
      reading.value,
      this.dependencies.lessons,
      this.dependencies.memoryTerms,
    )
    if (!frames.ok) {
      return respondRefusal(c, frames.error)
    }
    const body: KeepGoingFrames = frames.value
    return c.json(body)
  }
}
