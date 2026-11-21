import type { OpenAPIHono } from '@hono/zod-openapi'
import {
  type StartBuildingWorkRouteDependencies,
  startBuildingWorkRoute,
} from './startBuildingWorkRoute'
import {
  type StopBuildingWorkRouteDependencies,
  stopBuildingWorkRoute,
} from './stopBuildingWorkRoute'

export type BuildingRouteDependencies = StartBuildingWorkRouteDependencies &
  StopBuildingWorkRouteDependencies

export const buildingRoutes = (
  routes: OpenAPIHono,
  dependencies: BuildingRouteDependencies,
): void => {
  startBuildingWorkRoute(routes, dependencies)
  stopBuildingWorkRoute(routes, dependencies)
}
