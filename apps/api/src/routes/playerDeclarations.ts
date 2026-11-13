import { createRoute } from '@hono/zod-openapi'
import { ScaffoldChangeSchema } from '@mygame/contracts'
import {
  jsonBody,
  jsonResponse,
  malformedResponse,
  signedInRoute,
} from '../http/responseDeclarations'
import { PlayerComponent } from './playerComponent'

const ScaffoldChangeComponent = ScaffoldChangeSchema.meta({ id: 'ScaffoldChange' })

export const playerDeclarations = {
  changeScaffold: createRoute(
    signedInRoute({
      method: 'put',
      path: '/scaffold',
      request: { body: jsonBody(ScaffoldChangeComponent) },
      responses: {
        200: jsonResponse(
          'The player with the scaffold language changed; no card changes.',
          PlayerComponent,
        ),
        400: malformedResponse('body'),
      },
    }),
  ),
}
