import { createRoute } from '@hono/zod-openapi'
import type { ReportClosings } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'

export const closeReportDeclaration = createRoute(
  signedInDeclaration({
    method: 'post',
    path: '/close',
    responses: {
      204: { description: 'The Report is closed at the clock instant.' },
    },
  }),
)

export type CloseReportControllerDependencies = {
  readonly reportClosings: ReportClosings
}

export class CloseReportController {
  constructor(private readonly dependencies: CloseReportControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    await this.dependencies.reportClosings.close(c.var.playerId)
    return c.body(null, 204)
  }
}
