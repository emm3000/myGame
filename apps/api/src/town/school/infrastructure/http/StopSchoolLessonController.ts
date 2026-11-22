import { createRoute } from '@hono/zod-openapi'
import { StopLessonRequestSchema } from '@mygame/contracts'
import type { StopSchoolLesson } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import {
  type RespondTownReadingDependencies,
  respondTownReading,
} from '../../../infrastructure/http/respondTownReading'
import { overviewResponse, townNotFoundResponse } from '../../../infrastructure/http/townComponents'

export const stopSchoolLessonDeclaration = createRoute(
  signedInDeclaration({
    method: 'delete',
    path: '/lessons/{lessonId}',
    request: { params: StopLessonRequestSchema },
    responses: {
      200: overviewResponse('The town with the lesson stopped; nothing is studied.'),
      404: townNotFoundResponse,
      409: refusalResponse('LessonStudyNotFound.'),
    },
  }),
)

export type StopSchoolLessonControllerDependencies = RespondTownReadingDependencies & {
  readonly stopSchoolLesson: StopSchoolLesson
}

export class StopSchoolLessonController {
  constructor(private readonly dependencies: StopSchoolLessonControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const request = StopLessonRequestSchema.safeParse(c.req.param())
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const changed = await this.dependencies.stopSchoolLesson.execute({
      playerId: c.var.playerId,
      lessonId: request.data.lessonId,
    })
    return respondTownReading(c, changed, this.dependencies)
  }
}
