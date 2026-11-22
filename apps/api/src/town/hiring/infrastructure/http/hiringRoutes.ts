import type { OpenAPIHono } from '@hono/zod-openapi'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import {
  PlaceHiringOrderController,
  type PlaceHiringOrderControllerDependencies,
  placeHiringOrderDeclaration,
} from './PlaceHiringOrderController'
import {
  StopHiringOrderController,
  type StopHiringOrderControllerDependencies,
  stopHiringOrderDeclaration,
} from './StopHiringOrderController'

export type HiringRouteDependencies = RequirePlayerDependencies &
  PlaceHiringOrderControllerDependencies &
  StopHiringOrderControllerDependencies

export const hiringRoutes = (routes: OpenAPIHono, dependencies: HiringRouteDependencies): void => {
  const signedIn = requirePlayer(dependencies)
  const placeHiringOrderController = new PlaceHiringOrderController(dependencies)
  const stopHiringOrderController = new StopHiringOrderController(dependencies)
  routes.openAPIRegistry.registerPath(placeHiringOrderDeclaration)
  routes.on(
    placeHiringOrderDeclaration.method,
    honoPathOf(placeHiringOrderDeclaration),
    signedIn,
    (c) => placeHiringOrderController.handle(c),
  )
  routes.openAPIRegistry.registerPath(stopHiringOrderDeclaration)
  routes.on(
    stopHiringOrderDeclaration.method,
    honoPathOf(stopHiringOrderDeclaration),
    signedIn,
    (c) => stopHiringOrderController.handle(c),
  )
}
