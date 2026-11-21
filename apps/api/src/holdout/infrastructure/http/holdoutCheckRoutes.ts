import { OpenAPIHono } from '@hono/zod-openapi'
import {
  type AnswerHoldoutCheckRouteDependencies,
  answerHoldoutCheckRoute,
} from './answerHoldoutCheckRoute'
import {
  type BeginHoldoutCheckRouteDependencies,
  beginHoldoutCheckRoute,
} from './beginHoldoutCheckRoute'
import {
  type ReadHoldoutChecksRouteDependencies,
  readHoldoutChecksRoute,
} from './readHoldoutChecksRoute'
import {
  type SkipHoldoutCheckRouteDependencies,
  skipHoldoutCheckRoute,
} from './skipHoldoutCheckRoute'

export type HoldoutCheckRouteDependencies = ReadHoldoutChecksRouteDependencies &
  BeginHoldoutCheckRouteDependencies &
  AnswerHoldoutCheckRouteDependencies &
  SkipHoldoutCheckRouteDependencies

export const holdoutCheckRoutes = (dependencies: HoldoutCheckRouteDependencies): OpenAPIHono => {
  const routes = new OpenAPIHono()
  readHoldoutChecksRoute(routes, dependencies)
  beginHoldoutCheckRoute(routes, dependencies)
  answerHoldoutCheckRoute(routes, dependencies)
  skipHoldoutCheckRoute(routes, dependencies)
  return routes
}
