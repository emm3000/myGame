import { createRoute } from '@hono/zod-openapi'
import { type Report, ReportSchema } from '@mygame/contracts'
import type { ServeReport } from '@mygame/domain'
import type { Context } from 'hono'
import type { SignedInPlayer } from '#account/infrastructure/http/requirePlayer'
import { respondRefusal } from '#platform/infrastructure/http/respondRefusal'
import { jsonResponse } from '#platform/infrastructure/http/responseDeclarations'
import { signedInDeclaration } from '#platform/infrastructure/http/signedInDeclaration'
import { presentReport } from './presentReport'

export const serveReportDeclaration = createRoute(
  signedInDeclaration({
    method: 'get',
    path: '/',
    responses: {
      200: jsonResponse(
        'The reviews due, then the Town News since the player last closed the Report; with no town, the reviews and no news.',
        ReportSchema,
      ),
    },
  }),
)

export type ServeReportControllerDependencies = {
  readonly serveReport: ServeReport
}

export class ServeReportController {
  constructor(private readonly dependencies: ServeReportControllerDependencies) {}

  async handle(c: Context<SignedInPlayer>): Promise<Response> {
    const report = await this.dependencies.serveReport.execute({ playerId: c.var.playerId })
    if (!report.ok) {
      return respondRefusal(c, report.error)
    }
    const body: Report = presentReport(report.value)
    return c.json(body)
  }
}
