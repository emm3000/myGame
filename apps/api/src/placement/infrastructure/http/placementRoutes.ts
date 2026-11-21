import { OpenAPIHono } from '@hono/zod-openapi'
import { type AnswerPlacementRouteDependencies, answerPlacementRoute } from './answerPlacementRoute'
import { type BeginPlacementRouteDependencies, beginPlacementRoute } from './beginPlacementRoute'
import { type ReadPlacementRouteDependencies, readPlacementRoute } from './readPlacementRoute'
import { type SkipPlacementRouteDependencies, skipPlacementRoute } from './skipPlacementRoute'

export type PlacementRouteDependencies = ReadPlacementRouteDependencies &
  BeginPlacementRouteDependencies &
  SkipPlacementRouteDependencies &
  AnswerPlacementRouteDependencies

export const placementRoutes = (dependencies: PlacementRouteDependencies): OpenAPIHono => {
  const routes = new OpenAPIHono()
  readPlacementRoute(routes, dependencies)
  beginPlacementRoute(routes, dependencies)
  skipPlacementRoute(routes, dependencies)
  answerPlacementRoute(routes, dependencies)
  return routes
}
