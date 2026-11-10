import { createRoute } from '@hono/zod-openapi'
import {
  FoundTownSchema,
  StartBuildingWorkSchema,
  StartLessonRequestSchema,
  StopBuildingWorkSchema,
  StopLessonRequestSchema,
  TownNewsFeedSchema,
  TownOverviewSchema,
} from '@mygame/contracts'
import { type ResponseDeclaration, refusalResponse } from '../http/refusalResponse'
import { jsonBody, jsonResponse, signedInRoute } from '../http/responseDeclarations'

const townNotFoundResponse = refusalResponse('TownNotFound: the player holds no town yet.')

const overviewResponse = (description: string): ResponseDeclaration =>
  jsonResponse(description, TownOverviewSchema)

const malformedResponse = (what: string): ResponseDeclaration => ({
  description: `A malformed ${what}. Empty body.`,
})

export const townDeclarations = {
  overview: createRoute(
    signedInRoute({
      method: 'get',
      path: '/',
      responses: {
        200: overviewResponse(
          'The player’s town, accrued to the read, with every finished work applied.',
        ),
        404: townNotFoundResponse,
      },
    }),
  ),
  news: createRoute(
    signedInRoute({
      method: 'get',
      path: '/news',
      responses: {
        200: jsonResponse(
          'The town’s news, newest first, after every finished work is applied: each item its kind, its params and its instant, no prose.',
          TownNewsFeedSchema,
        ),
        404: townNotFoundResponse,
      },
    }),
  ),
  found: createRoute(
    signedInRoute({
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
  ),
  startWork: createRoute(
    signedInRoute({
      method: 'post',
      path: '/work',
      request: { body: jsonBody(StartBuildingWorkSchema) },
      responses: {
        200: overviewResponse('The town with the work started in the slot or on the waiting list.'),
        400: malformedResponse('body'),
        404: townNotFoundResponse,
        409: refusalResponse(
          'WaitingListFull, TopLevelReached, NotEnoughPeople or NotEnoughResources.',
        ),
      },
    }),
  ),
  stopWork: createRoute(
    signedInRoute({
      method: 'delete',
      path: '/work/{building}/{level}',
      request: { params: StopBuildingWorkSchema },
      responses: {
        200: overviewResponse('The town with the work stopped and its cost refunded in full.'),
        400: malformedResponse('path'),
        404: townNotFoundResponse,
        409: refusalResponse('BuildingWorkNotFound.'),
      },
    }),
  ),
  startLesson: createRoute(
    signedInRoute({
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
  ),
  stopLesson: createRoute(
    signedInRoute({
      method: 'delete',
      path: '/lessons/{lessonId}',
      request: { params: StopLessonRequestSchema },
      responses: {
        200: overviewResponse('The town with the lesson stopped; nothing is studied.'),
        400: malformedResponse('path'),
        404: townNotFoundResponse,
        409: refusalResponse('LessonStudyNotFound.'),
      },
    }),
  ),
}
