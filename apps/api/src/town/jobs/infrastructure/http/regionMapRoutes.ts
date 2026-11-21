import { OpenAPIHono } from '@hono/zod-openapi'
import { type ReadAreaRouteDependencies, readAreaDeclaration, readAreaRoute } from './readAreaRoute'
import {
  type ReadOwnAreaRouteDependencies,
  readOwnAreaDeclaration,
  readOwnAreaRoute,
} from './readOwnAreaRoute'

export type RegionMapRouteDependencies = ReadOwnAreaRouteDependencies & ReadAreaRouteDependencies

export const regionMapDeclarations = {
  ownArea: readOwnAreaDeclaration,
  area: readAreaDeclaration,
}

export const regionMapRoutes = (dependencies: RegionMapRouteDependencies): OpenAPIHono => {
  const routes = new OpenAPIHono()
  readOwnAreaRoute(routes, dependencies)
  readAreaRoute(routes, dependencies)
  return routes
}
