import type { OpenAPIHono } from '@hono/zod-openapi'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import {
  DismissGuidanceController,
  type DismissGuidanceControllerDependencies,
  dismissGuidanceDeclaration,
} from './DismissGuidanceController'
import {
  MarkTipSeenController,
  type MarkTipSeenControllerDependencies,
  markTipSeenDeclaration,
} from './MarkTipSeenController'

export type GuidanceRouteDependencies = RequirePlayerDependencies &
  MarkTipSeenControllerDependencies &
  DismissGuidanceControllerDependencies

export const guidanceRoutes = (
  routes: OpenAPIHono,
  dependencies: GuidanceRouteDependencies,
): void => {
  const signedIn = requirePlayer(dependencies)
  const markTipSeenController = new MarkTipSeenController(dependencies)
  const dismissGuidanceController = new DismissGuidanceController(dependencies)
  routes.openAPIRegistry.registerPath(markTipSeenDeclaration)
  routes.on(markTipSeenDeclaration.method, honoPathOf(markTipSeenDeclaration), signedIn, (c) =>
    markTipSeenController.handle(c),
  )
  routes.openAPIRegistry.registerPath(dismissGuidanceDeclaration)
  routes.on(
    dismissGuidanceDeclaration.method,
    honoPathOf(dismissGuidanceDeclaration),
    signedIn,
    (c) => dismissGuidanceController.handle(c),
  )
}
