import { OpenAPIHono } from '@hono/zod-openapi'
import { HintKindSchema } from '@mygame/contracts'
import type { SeenHints } from '../hint/SeenHints'
import { answerRefusal } from '../http/answerRefusal'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'
import { honoPathOf } from '../http/responseDeclarations'
import { hintsDeclarations } from './hintsDeclarations'

export type HintsDependencies = RequirePlayerDependencies & {
  readonly seenHints: SeenHints
}

export const hintsRoutes = (dependencies: HintsDependencies): OpenAPIHono => {
  const routes = new OpenAPIHono()
  routes.openAPIRegistry.registerPath(hintsDeclarations.markSeen)
  routes.on(
    hintsDeclarations.markSeen.method,
    honoPathOf(hintsDeclarations.markSeen),
    requirePlayer(dependencies),
    async (c) => {
      const hint = HintKindSchema.safeParse(c.req.param('hint'))
      if (!hint.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      await dependencies.seenHints.markSeen(c.var.playerId, hint.data)
      return c.body(null, 204)
    },
  )
  return routes
}
