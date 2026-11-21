import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { StartLessonRequestSchema } from '@mygame/contracts'
import { ok, type RandomSource, startSchoolLesson } from '@mygame/domain'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { readJsonBody } from '#platform/infrastructure/http/readJsonBody'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonBody, malformedResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import {
  type RespondTownChangeDependencies,
  respondTownChange,
} from '../../../infrastructure/http/respondTownChange'
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

export type StartSchoolLessonRouteDependencies = RequirePlayerDependencies &
  RespondTownChangeDependencies & {
    readonly random: RandomSource
  }

export const startSchoolLessonRoute = (
  routes: OpenAPIHono,
  dependencies: StartSchoolLessonRouteDependencies,
): void => {
  const { lessons, random, townCatalog: catalog } = dependencies
  routes.openAPIRegistry.registerPath(startSchoolLessonDeclaration)
  routes.on(
    startSchoolLessonDeclaration.method,
    honoPathOf(startSchoolLessonDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const request = StartLessonRequestSchema.safeParse(await readJsonBody(c))
      if (!request.success) {
        return respondRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      return respondTownChange(
        c,
        playerId,
        async (stores, clock) => {
          const slot = await startSchoolLesson(
            { playerId, lessonId: request.data.lessonId },
            {
              ...stores,
              news: stores.townNews,
              lessons,
              bands: lessons,
              random,
              catalog,
              clock,
            },
          )
          return slot.ok ? ok(clock.now()) : slot
        },
        dependencies,
      )
    },
  )
}
