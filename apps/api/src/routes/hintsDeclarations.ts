import { createRoute } from '@hono/zod-openapi'
import { HintKindSchema } from '@mygame/contracts'
import { z } from 'zod'
import { signedOutResponse } from '../http/responseDeclarations'

export const hintsDeclarations = {
  markSeen: createRoute({
    method: 'post',
    path: '/{hint}',
    request: { params: z.object({ hint: HintKindSchema }) },
    responses: {
      204: { description: 'The hint is marked seen.' },
      400: { description: 'An unknown hint. Empty body.' },
      401: signedOutResponse,
    },
  }),
}
