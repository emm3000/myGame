import { OpenAPIHono } from '@hono/zod-openapi'
import {
  type BuildingRouteDependencies,
  buildingRoutes,
} from '../../building/infrastructure/http/buildingRoutes'
import { startBuildingWorkDeclaration } from '../../building/infrastructure/http/startBuildingWorkRoute'
import { stopBuildingWorkDeclaration } from '../../building/infrastructure/http/stopBuildingWorkRoute'
import { dismissGuidanceDeclaration } from '../../guidance/infrastructure/http/dismissGuidanceRoute'
import {
  type GuidanceRouteDependencies,
  guidanceRoutes,
} from '../../guidance/infrastructure/http/guidanceRoutes'
import { markTipSeenDeclaration } from '../../guidance/infrastructure/http/markTipSeenRoute'
import {
  type HiringRouteDependencies,
  hiringRoutes,
} from '../../hiring/infrastructure/http/hiringRoutes'
import { placeHiringOrderDeclaration } from '../../hiring/infrastructure/http/placeHiringOrderRoute'
import { stopHiringOrderDeclaration } from '../../hiring/infrastructure/http/stopHiringOrderRoute'
import { callJobBackDeclaration } from '../../jobs/infrastructure/http/callJobBackRoute'
import { type JobsRouteDependencies, jobsRoutes } from '../../jobs/infrastructure/http/jobsRoutes'
import { quoteCleanUpDeclaration } from '../../jobs/infrastructure/http/quoteCleanUpRoute'
import { quoteJobDeclaration } from '../../jobs/infrastructure/http/quoteJobRoute'
import { sendCleanUpDeclaration } from '../../jobs/infrastructure/http/sendCleanUpRoute'
import { sendJobDeclaration } from '../../jobs/infrastructure/http/sendJobRoute'
import {
  type ResolveTownNewsRouteDependencies,
  resolveTownNewsDeclaration,
  resolveTownNewsRoute,
} from '../../news/infrastructure/http/resolveTownNewsRoute'
import {
  type SchoolRouteDependencies,
  schoolRoutes,
} from '../../school/infrastructure/http/schoolRoutes'
import { startSchoolLessonDeclaration } from '../../school/infrastructure/http/startSchoolLessonRoute'
import { stopSchoolLessonDeclaration } from '../../school/infrastructure/http/stopSchoolLessonRoute'
import {
  type FoundTownRouteDependencies,
  foundTownDeclaration,
  foundTownRoute,
} from './foundTownRoute'
import { type OpenTextRouteDependencies, openTextDeclaration, openTextRoute } from './openTextRoute'
import {
  type ResolveCurrentTownRouteDependencies,
  resolveCurrentTownDeclaration,
  resolveCurrentTownRoute,
} from './resolveCurrentTownRoute'

export type TownRouteDependencies = ResolveCurrentTownRouteDependencies &
  ResolveTownNewsRouteDependencies &
  OpenTextRouteDependencies &
  FoundTownRouteDependencies &
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
  resolveCurrentTownRoute(routes, dependencies)
  resolveTownNewsRoute(routes, dependencies)
  openTextRoute(routes, dependencies)
  foundTownRoute(routes, dependencies)
  buildingRoutes(routes, dependencies)
  hiringRoutes(routes, dependencies)
  jobsRoutes(routes, dependencies)
  schoolRoutes(routes, dependencies)
  guidanceRoutes(routes, dependencies)
  return routes
}
