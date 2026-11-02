import { createRoute } from '@hono/zod-openapi'
import { HintKindSchema } from '@mygame/contracts'
import { z } from 'zod'
import { signedInRoute } from '../http/responseDeclarations'

export const hintsDeclarations = {
  markSeen: createRoute(
    signedInRoute({
      method: 'post',
      path: '/{hint}',
      request: { params: z.object({ hint: HintKindSchema }) },
      responses: {
        204: { description: 'The hint is marked seen.' },
        400: { description: 'An unknown hint. Empty body.' },
      },
    }),
  ),
}
