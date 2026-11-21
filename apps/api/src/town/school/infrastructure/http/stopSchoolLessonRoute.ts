import { createRoute, type OpenAPIHono } from '@hono/zod-openapi'
import { StopLessonRequestSchema } from '@mygame/contracts'
import { ok, stopSchoolLesson } from '@mygame/domain'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { answerRefusal } from '#platform/infrastructure/http/answerRefusal'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import { refusalResponse } from '#platform/infrastructure/http/refusalResponse'
import { signedInRoute } from '#platform/infrastructure/http/signedInRoute'
import {
  type AnswerTownChangeDependencies,
  answerTownChange,
} from '../../../infrastructure/http/answerTownChange'
import { overviewResponse, townNotFoundResponse } from '../../../infrastructure/http/townComponents'

export const stopSchoolLessonDeclaration = createRoute(
  signedInRoute({
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

export type StopSchoolLessonRouteDependencies = RequirePlayerDependencies &
  AnswerTownChangeDependencies

export const stopSchoolLessonRoute = (
  routes: OpenAPIHono,
  dependencies: StopSchoolLessonRouteDependencies,
): void => {
  const { lessons, townCatalog: catalog } = dependencies
  routes.openAPIRegistry.registerPath(stopSchoolLessonDeclaration)
  routes.on(
    stopSchoolLessonDeclaration.method,
    honoPathOf(stopSchoolLessonDeclaration),
    requirePlayer(dependencies),
    async (c) => {
      const request = StopLessonRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const playerId = c.var.playerId
      return answerTownChange(
        c,
        playerId,
        async (stores, clock) => {
          const change = await stopSchoolLesson(
            { playerId, lessonId: request.data.lessonId },
            { ...stores, news: stores.townNews, lessons, bands: lessons, catalog, clock },
          )
          return change.ok ? ok(clock.now()) : change
        },
        dependencies,
      )
    },
  )
}
