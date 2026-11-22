import { OpenAPIHono } from '@hono/zod-openapi'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import {
  ReadAreaController,
  type ReadAreaControllerDependencies,
  readAreaDeclaration,
} from './ReadAreaController'
import {
  ReadOwnAreaController,
  type ReadOwnAreaControllerDependencies,
  readOwnAreaDeclaration,
} from './ReadOwnAreaController'

export type RegionMapRouteDependencies = RequirePlayerDependencies &
  ReadOwnAreaControllerDependencies &
  ReadAreaControllerDependencies

export const regionMapDeclarations = {
  ownArea: readOwnAreaDeclaration,
  area: readAreaDeclaration,
}

export const regionMapRoutes = (dependencies: RegionMapRouteDependencies): OpenAPIHono => {
  const routes = new OpenAPIHono()
  const signedIn = requirePlayer(dependencies)
  const readOwnAreaController = new ReadOwnAreaController(dependencies)
  const readAreaController = new ReadAreaController(dependencies)
  routes.openAPIRegistry.registerPath(readOwnAreaDeclaration)
  routes.on(readOwnAreaDeclaration.method, honoPathOf(readOwnAreaDeclaration), signedIn, (c) =>
    readOwnAreaController.handle(c),
  )
  routes.openAPIRegistry.registerPath(readAreaDeclaration)
  routes.on(readAreaDeclaration.method, honoPathOf(readAreaDeclaration), signedIn, (c) =>
    readAreaController.handle(c),
  )
  return routes
}
