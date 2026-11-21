import type { OpenAPIHono } from '@hono/zod-openapi'
import {
  type StartSchoolLessonRouteDependencies,
  startSchoolLessonRoute,
} from './startSchoolLessonRoute'
import {
  type StopSchoolLessonRouteDependencies,
  stopSchoolLessonRoute,
} from './stopSchoolLessonRoute'

export type SchoolRouteDependencies = StartSchoolLessonRouteDependencies &
  StopSchoolLessonRouteDependencies

export const schoolRoutes = (routes: OpenAPIHono, dependencies: SchoolRouteDependencies): void => {
  startSchoolLessonRoute(routes, dependencies)
  stopSchoolLessonRoute(routes, dependencies)
}
