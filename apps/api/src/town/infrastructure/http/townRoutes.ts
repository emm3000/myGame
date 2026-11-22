import { OpenAPIHono } from '@hono/zod-openapi'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import {
  type BuildingRouteDependencies,
  buildingRoutes,
} from '../../building/infrastructure/http/buildingRoutes'
import { startBuildingWorkDeclaration } from '../../building/infrastructure/http/StartBuildingWorkController'
import { stopBuildingWorkDeclaration } from '../../building/infrastructure/http/StopBuildingWorkController'
import { dismissGuidanceDeclaration } from '../../guidance/infrastructure/http/DismissGuidanceController'
import {
  type GuidanceRouteDependencies,
  guidanceRoutes,
} from '../../guidance/infrastructure/http/guidanceRoutes'
import { markTipSeenDeclaration } from '../../guidance/infrastructure/http/MarkTipSeenController'
import {
  type HiringRouteDependencies,
  hiringRoutes,
} from '../../hiring/infrastructure/http/hiringRoutes'
import { placeHiringOrderDeclaration } from '../../hiring/infrastructure/http/PlaceHiringOrderController'
import { stopHiringOrderDeclaration } from '../../hiring/infrastructure/http/StopHiringOrderController'
import { callJobBackDeclaration } from '../../jobs/infrastructure/http/CallJobBackController'
import { type JobsRouteDependencies, jobsRoutes } from '../../jobs/infrastructure/http/jobsRoutes'
import { quoteCleanUpDeclaration } from '../../jobs/infrastructure/http/QuoteCleanUpController'
import { quoteJobDeclaration } from '../../jobs/infrastructure/http/QuoteJobController'
import { sendCleanUpDeclaration } from '../../jobs/infrastructure/http/SendCleanUpController'
import { sendJobDeclaration } from '../../jobs/infrastructure/http/SendJobController'
import {
  ResolveTownNewsController,
  type ResolveTownNewsControllerDependencies,
  resolveTownNewsDeclaration,
} from '../../news/infrastructure/http/ResolveTownNewsController'
import { startSchoolLessonDeclaration } from '../../school/infrastructure/http/StartSchoolLessonController'
import { stopSchoolLessonDeclaration } from '../../school/infrastructure/http/StopSchoolLessonController'
import {
  type SchoolRouteDependencies,
  schoolRoutes,
} from '../../school/infrastructure/http/schoolRoutes'
import {
  FoundTownController,
  type FoundTownControllerDependencies,
  foundTownDeclaration,
} from './FoundTownController'
import {
  OpenTextController,
  type OpenTextControllerDependencies,
  openTextDeclaration,
} from './OpenTextController'
import {
  ResolveCurrentTownController,
  type ResolveCurrentTownControllerDependencies,
  resolveCurrentTownDeclaration,
} from './ResolveCurrentTownController'

export type TownRouteDependencies = RequirePlayerDependencies &
  ResolveCurrentTownControllerDependencies &
  ResolveTownNewsControllerDependencies &
  OpenTextControllerDependencies &
  FoundTownControllerDependencies &
  BuildingRouteDependencies &
  HiringRouteDependencies &
  JobsRouteDependencies &
  SchoolRouteDependencies &
  GuidanceRouteDependencies

export const townDeclarations = {
  overview: resolveCurrentTownDeclaration,
  news: resolveTownNewsDeclaration,
  text: openTextDeclaration,
  found: foundTownDeclaration,
  startWork: startBuildingWorkDeclaration,
  stopWork: stopBuildingWorkDeclaration,
  placeHiring: placeHiringOrderDeclaration,
  stopHiring: stopHiringOrderDeclaration,
  sendJob: sendJobDeclaration,
  quoteJob: quoteJobDeclaration,
  sendCleanUp: sendCleanUpDeclaration,
  quoteCleanUp: quoteCleanUpDeclaration,
  callJobBack: callJobBackDeclaration,
  startLesson: startSchoolLessonDeclaration,
  stopLesson: stopSchoolLessonDeclaration,
  markTipSeen: markTipSeenDeclaration,
  dismissGuidance: dismissGuidanceDeclaration,
}

export const townRoutes = (dependencies: TownRouteDependencies): OpenAPIHono => {
  const routes = new OpenAPIHono()
  const signedIn = requirePlayer(dependencies)
  const resolveCurrentTownController = new ResolveCurrentTownController(dependencies)
  const resolveTownNewsController = new ResolveTownNewsController(dependencies)
  const openTextController = new OpenTextController(dependencies)
  const foundTownController = new FoundTownController(dependencies)
  routes.openAPIRegistry.registerPath(resolveCurrentTownDeclaration)
  routes.on(
    resolveCurrentTownDeclaration.method,
    honoPathOf(resolveCurrentTownDeclaration),
    signedIn,
    (c) => resolveCurrentTownController.handle(c),
  )
  routes.openAPIRegistry.registerPath(resolveTownNewsDeclaration)
  routes.on(
    resolveTownNewsDeclaration.method,
    honoPathOf(resolveTownNewsDeclaration),
    signedIn,
    (c) => resolveTownNewsController.handle(c),
  )
  routes.openAPIRegistry.registerPath(openTextDeclaration)
  routes.on(openTextDeclaration.method, honoPathOf(openTextDeclaration), signedIn, (c) =>
    openTextController.handle(c),
  )
  routes.openAPIRegistry.registerPath(foundTownDeclaration)
  routes.on(foundTownDeclaration.method, honoPathOf(foundTownDeclaration), signedIn, (c) =>
    foundTownController.handle(c),
  )
  buildingRoutes(routes, dependencies)
  hiringRoutes(routes, dependencies)
  jobsRoutes(routes, dependencies)
  schoolRoutes(routes, dependencies)
  guidanceRoutes(routes, dependencies)
  return routes
}
