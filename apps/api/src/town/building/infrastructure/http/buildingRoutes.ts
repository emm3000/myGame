import type { OpenAPIHono } from '@hono/zod-openapi'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import {
  StartBuildingWorkController,
  type StartBuildingWorkControllerDependencies,
  startBuildingWorkDeclaration,
} from './StartBuildingWorkController'
import {
  StopBuildingWorkController,
  type StopBuildingWorkControllerDependencies,
  stopBuildingWorkDeclaration,
} from './StopBuildingWorkController'

export type BuildingRouteDependencies = RequirePlayerDependencies &
  StartBuildingWorkControllerDependencies &
  StopBuildingWorkControllerDependencies

export const buildingRoutes = (
  routes: OpenAPIHono,
  dependencies: BuildingRouteDependencies,
): void => {
  const signedIn = requirePlayer(dependencies)
  const startBuildingWorkController = new StartBuildingWorkController(dependencies)
  const stopBuildingWorkController = new StopBuildingWorkController(dependencies)
  routes.openAPIRegistry.registerPath(startBuildingWorkDeclaration)
  routes.on(
    startBuildingWorkDeclaration.method,
    honoPathOf(startBuildingWorkDeclaration),
    signedIn,
    (c) => startBuildingWorkController.handle(c),
  )
  routes.openAPIRegistry.registerPath(stopBuildingWorkDeclaration)
  routes.on(
    stopBuildingWorkDeclaration.method,
    honoPathOf(stopBuildingWorkDeclaration),
    signedIn,
    (c) => stopBuildingWorkController.handle(c),
  )
}
