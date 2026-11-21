import type { OpenAPIHono } from '@hono/zod-openapi'
import { type CallJobBackRouteDependencies, callJobBackRoute } from './callJobBackRoute'
import { type QuoteCleanUpRouteDependencies, quoteCleanUpRoute } from './quoteCleanUpRoute'
import { type QuoteJobRouteDependencies, quoteJobRoute } from './quoteJobRoute'
import { type SendCleanUpRouteDependencies, sendCleanUpRoute } from './sendCleanUpRoute'
import { type SendJobRouteDependencies, sendJobRoute } from './sendJobRoute'

export type JobsRouteDependencies = SendJobRouteDependencies &
  QuoteJobRouteDependencies &
  SendCleanUpRouteDependencies &
  QuoteCleanUpRouteDependencies &
  CallJobBackRouteDependencies

export const jobsRoutes = (routes: OpenAPIHono, dependencies: JobsRouteDependencies): void => {
  sendJobRoute(routes, dependencies)
  quoteJobRoute(routes, dependencies)
  sendCleanUpRoute(routes, dependencies)
  quoteCleanUpRoute(routes, dependencies)
  callJobBackRoute(routes, dependencies)
}
