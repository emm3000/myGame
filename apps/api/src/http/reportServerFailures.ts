import type { Context, MiddlewareHandler } from 'hono'
import type { FailureSink } from './FailureSink'

const lowestServerFailureStatus = 500

const causeOf = (c: Context): string | undefined => {
  if (c.error !== undefined) {
    return `${c.error.name}: ${c.error.message}`
  }
  return c.get('refusalKind')
}

const failureLineOf = (c: Context): string => {
  const answered = `${c.req.method} ${c.req.path} ${c.res.status}`
  const cause = causeOf(c)
  return cause === undefined ? answered : `${answered} ${cause}`
}

export const reportServerFailures =
  (sink: FailureSink): MiddlewareHandler =>
  async (c, next) => {
    await next()
    if (c.res.status >= lowestServerFailureStatus) {
      sink.write(failureLineOf(c))
    }
  }
