import { createRoute } from '@hono/zod-openapi'
import { DigestSchema } from '@mygame/contracts'
import { jsonResponse, signedOutResponse } from '../http/responseDeclarations'

const DigestComponent = DigestSchema.meta({ id: 'Digest' })

export const digestDeclarations = {
  read: createRoute({
    method: 'get',
    path: '/',
    responses: {
      200: jsonResponse(
        'What happened in the lord’s fiefs since the last acknowledgement; nothing is written.',
        DigestComponent,
      ),
      401: signedOutResponse,
    },
  }),
  acknowledge: createRoute({
    method: 'post',
    path: '/acknowledgement',
    responses: {
      204: { description: 'The digest is acknowledged at the read instant.' },
      401: signedOutResponse,
    },
  }),
}
