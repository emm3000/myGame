import { OpenAPIHono } from '@hono/zod-openapi'
import type { Digest } from '@mygame/contracts'
import { type DigestReadDependencies, digestOf } from '../digest/digestOf'
import { answerRefusal } from '../http/answerRefusal'
import { honoPathOf } from '../http/honoPath'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'
import { digestDeclarations } from './digestDeclarations'

export type DigestDependencies = RequirePlayerDependencies & DigestReadDependencies

export const digestRoutes = (dependencies: DigestDependencies): OpenAPIHono => {
  const signedInPlayer = requirePlayer(dependencies)
  const routes = new OpenAPIHono()
  for (const declaration of Object.values(digestDeclarations)) {
    routes.openAPIRegistry.registerPath(declaration)
  }
  routes.on(
    digestDeclarations.read.method,
    honoPathOf(digestDeclarations.read),
    signedInPlayer,
    async (c) => {
      const digest = await digestOf(c.var.playerId, dependencies)
      if (!digest.ok) {
        return answerRefusal(c, digest.error)
      }
      const body: Digest = digest.value
      return c.json(body)
    },
  )
  routes.on(
    digestDeclarations.acknowledge.method,
    honoPathOf(digestDeclarations.acknowledge),
    signedInPlayer,
    async (c) => {
      await dependencies.digestAcknowledgements.acknowledge(
        c.var.playerId,
        dependencies.clock.now(),
      )
      return c.body(null, 204)
    },
  )
  return routes
}
