import { createRoute } from '@hono/zod-openapi'
import { FiefListSchema } from '@mygame/contracts'
import { jsonResponse, signedOutResponse } from '../http/responseDeclarations'

const FiefListComponent = FiefListSchema.meta({ id: 'FiefList' })

export const fiefsDeclarations = {
  list: createRoute({
    method: 'get',
    path: '/',
    responses: {
      200: jsonResponse(
        'The fiefs the signed-in lord holds, province then plot; the session is renewed.',
        FiefListComponent,
      ),
      401: signedOutResponse,
    },
  }),
}
