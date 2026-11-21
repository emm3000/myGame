import type { OpenAPIHono } from '@hono/zod-openapi'
import { type DismissGuidanceRouteDependencies, dismissGuidanceRoute } from './dismissGuidanceRoute'
import { type MarkTipSeenRouteDependencies, markTipSeenRoute } from './markTipSeenRoute'

export type GuidanceRouteDependencies = MarkTipSeenRouteDependencies &
  DismissGuidanceRouteDependencies

export const guidanceRoutes = (
  routes: OpenAPIHono,
  dependencies: GuidanceRouteDependencies,
): void => {
  markTipSeenRoute(routes, dependencies)
  dismissGuidanceRoute(routes, dependencies)
}
