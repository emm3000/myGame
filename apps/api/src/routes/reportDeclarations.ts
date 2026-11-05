import { createRoute } from '@hono/zod-openapi'
import { ReportSchema } from '@mygame/contracts/town'
import { jsonResponse, signedInRoute } from '../http/responseDeclarations'

export const reportDeclarations = {
  read: createRoute(
    signedInRoute({
      method: 'get',
      path: '/',
      responses: {
        200: jsonResponse(
          'The reviews due, then the Town News since the player last closed the Report; with no town, the reviews and no news.',
          ReportSchema,
        ),
      },
    }),
  ),
  close: createRoute(
    signedInRoute({
      method: 'post',
      path: '/close',
      responses: {
        204: { description: 'The Report is closed at the clock instant.' },
      },
    }),
  ),
}
