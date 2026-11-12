import { createRoute } from '@hono/zod-openapi'
import { PlacementAnswersSchema, PlacementSchema } from '@mygame/contracts'
import type { ResponseDeclaration } from '../http/refusalResponse'
import { jsonBody, jsonResponse, signedInRoute } from '../http/responseDeclarations'

const offerRefused: ResponseDeclaration = {
  description:
    'PlacementAlreadyTaken, a placement taken or skipped before, or PlacementNotOffered, a band started or band 1 not drafted. Empty body.',
}

export const placementDeclarations = {
  readPlacement: createRoute(
    signedInRoute({
      method: 'get',
      path: '/',
      responses: {
        200: jsonResponse(
          'The placement offered, the band it asks with its words and choices, or the stored scores once it is closed.',
          PlacementSchema,
        ),
      },
    }),
  ),
  beginPlacement: createRoute(
    signedInRoute({
      method: 'post',
      path: '/',
      responses: {
        200: jsonResponse(
          'The placement begun: the api drew each band’s sample and asks band 1.',
          PlacementSchema,
        ),
        409: offerRefused,
      },
    }),
  ),
  skipPlacement: createRoute(
    signedInRoute({
      method: 'post',
      path: '/skip',
      responses: {
        200: jsonResponse(
          'The placement skipped for good; the player starts at lesson 1.',
          PlacementSchema,
        ),
        409: offerRefused,
      },
    }),
  ),
  answerPlacement: createRoute(
    signedInRoute({
      method: 'post',
      path: '/answers',
      request: { body: jsonBody(PlacementAnswersSchema) },
      responses: {
        200: jsonResponse(
          'The band scored: the next band asked once it passes at 29 of 30, else the placement closed.',
          PlacementSchema,
        ),
        400: {
          description:
            'A malformed body, or InvalidPlacementAnswers: not one offered choice for each asked word. Empty body.',
        },
        409: {
          description: 'PlacementBandNotAsked: the check does not ask that band. Empty body.',
        },
      },
    }),
  ),
}
