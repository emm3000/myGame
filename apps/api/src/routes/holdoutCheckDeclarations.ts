import { createRoute } from '@hono/zod-openapi'
import {
  HoldoutCheckAnswersSchema,
  HoldoutCheckRequestSchema,
  HoldoutChecksSchema,
} from '@mygame/contracts'
import type { ResponseDeclaration } from '../http/refusalResponse'
import { jsonBody, jsonResponse, signedInRoute } from '../http/responseDeclarations'

const checkPath = { params: HoldoutCheckRequestSchema }

const malformed: ResponseDeclaration = {
  description: 'A band or a week the path cannot name. Empty body.',
}

const notDue: ResponseDeclaration = {
  description:
    'HoldoutCheckNotDue: the band has not started, the week is not reached, the check is closed, or an 8-week check lapsed at 24 weeks. Empty body.',
}

const checksAnswer = (description: string) => jsonResponse(description, HoldoutChecksSchema)

export const holdoutCheckDeclarations = {
  readHoldoutChecks: createRoute(
    signedInRoute({
      method: 'get',
      path: '/',
      responses: {
        200: checksAnswer(
          'Every check due at the read, derived from each band’s start: due, or asking its words once begun.',
        ),
      },
    }),
  ),
  beginHoldoutCheck: createRoute(
    signedInRoute({
      method: 'post',
      path: '/{band}/{week}',
      request: checkPath,
      responses: {
        200: checksAnswer(
          'The check begun: the api drew its practised words and asks them beside the held-out ones; a check begun before keeps its words.',
        ),
        400: malformed,
        409: notDue,
      },
    }),
  ),
  answerHoldoutCheck: createRoute(
    signedInRoute({
      method: 'post',
      path: '/{band}/{week}/answers',
      request: { ...checkPath, body: jsonBody(HoldoutCheckAnswersSchema) },
      responses: {
        200: checksAnswer('The check taken: its held-out and practised scores stored.'),
        400: {
          description:
            'A malformed path or body, or InvalidHoldoutCheckAnswers: not one offered choice for each asked word. Empty body.',
        },
        409: {
          description: `${notDue.description} Or HoldoutCheckNotBegun: the check is due but not begun.`,
        },
      },
    }),
  ),
  skipHoldoutCheck: createRoute(
    signedInRoute({
      method: 'post',
      path: '/{band}/{week}/skip',
      request: checkPath,
      responses: {
        200: checksAnswer(
          'The check skipped for good; a skipped 24-week check releases the band’s held-out words.',
        ),
        400: malformed,
        409: notDue,
      },
    }),
  ),
}
