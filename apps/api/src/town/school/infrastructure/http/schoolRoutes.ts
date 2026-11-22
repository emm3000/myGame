import type { OpenAPIHono } from '@hono/zod-openapi'
import {
  type RequirePlayerDependencies,
  requirePlayer,
} from '#account/infrastructure/http/requirePlayer'
import { honoPathOf } from '#platform/infrastructure/http/honoPath'
import {
  StartSchoolLessonController,
  type StartSchoolLessonControllerDependencies,
  startSchoolLessonDeclaration,
} from './StartSchoolLessonController'
import {
  StopSchoolLessonController,
  type StopSchoolLessonControllerDependencies,
  stopSchoolLessonDeclaration,
} from './StopSchoolLessonController'

export type SchoolRouteDependencies = RequirePlayerDependencies &
  StartSchoolLessonControllerDependencies &
  StopSchoolLessonControllerDependencies

export const schoolRoutes = (routes: OpenAPIHono, dependencies: SchoolRouteDependencies): void => {
  const signedIn = requirePlayer(dependencies)
  const startSchoolLessonController = new StartSchoolLessonController(dependencies)
  const stopSchoolLessonController = new StopSchoolLessonController(dependencies)
  routes.openAPIRegistry.registerPath(startSchoolLessonDeclaration)
  routes.on(
    startSchoolLessonDeclaration.method,
    honoPathOf(startSchoolLessonDeclaration),
    signedIn,
    (c) => startSchoolLessonController.handle(c),
  )
  routes.openAPIRegistry.registerPath(stopSchoolLessonDeclaration)
  routes.on(
    stopSchoolLessonDeclaration.method,
    honoPathOf(stopSchoolLessonDeclaration),
    signedIn,
    (c) => stopSchoolLessonController.handle(c),
  )
}
