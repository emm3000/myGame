import { createRoute } from '@hono/zod-openapi'
import { StartLessonRequestSchema } from '@mygame/contracts'
import type { StartSchoolLesson } from '@mygame/domain'
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
import { overviewResponse } from '../../../infrastructure/http/townComponents'

export const startSchoolLessonDeclaration = createRoute(
  signedInDeclaration({
    method: 'post',
    path: '/lessons',
    request: { body: jsonBody(StartLessonRequestSchema.meta({ id: 'StartLessonRequest' })) },
    responses: {
      200: overviewResponse('The town with the lesson under study in its school.'),
      400: malformedResponse('body'),
      404: refusalResponse(
        'TownNotFound; LessonNotFound, for a lesson the content lacks, answers an empty body.',
      ),
      409: refusalResponse(
        'StudySlotBusy, LessonSchoolTooLow, LessonAlreadyStudied, LessonUnderStudy or LearningCapReached.',
      ),
    },
  }),
)

export type StartSchoolLessonControllerDependencies = RespondTownReadingDependencies & {
  readonly startSchoolLesson: StartSchoolLesson
}

export class StartSchoolLessonController {
  constructor(private readonly dependencies: StartSchoolLessonControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const request = StartLessonRequestSchema.safeParse(await readJsonBody(c))
    if (!request.success) {
      return respondRefusal(c, { kind: 'MalformedRequest' })
    }
    const changed = await this.dependencies.startSchoolLesson.execute({
      playerId: c.var.playerId,
      lessonId: request.data.lessonId,
    })
    return respondTownReading(c, changed, this.dependencies)
  }
}
