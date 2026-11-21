import type { OpenAPIHono } from '@hono/zod-openapi'
import {
  type PlaceHiringOrderRouteDependencies,
  placeHiringOrderRoute,
} from './placeHiringOrderRoute'
import { type StopHiringOrderRouteDependencies, stopHiringOrderRoute } from './stopHiringOrderRoute'

export type HiringRouteDependencies = PlaceHiringOrderRouteDependencies &
  StopHiringOrderRouteDependencies

export const hiringRoutes = (routes: OpenAPIHono, dependencies: HiringRouteDependencies): void => {
  placeHiringOrderRoute(routes, dependencies)
  stopHiringOrderRoute(routes, dependencies)
}
