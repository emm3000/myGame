import { reportLoading } from '@mygame/catalog'
import type { Report } from '@mygame/contracts/town'
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import type { ApiClient } from '../../api/apiClient'
import { SignOutColumn } from '../../auth/SignOutColumn'
import { ReadingLine } from '../../design-system/ReadingLine'
import { refusalLineOf } from '../../refusals/refusalLineOf'
import { ReportScreen, ReportTitled } from '../../report/ReportScreen'
import { reportNewsRowOf } from '../../report/reportNewsRowOf'
import { useReport } from '../../report/useReport'
import { useReportAtLessonFinish } from '../../report/useReportAtLessonFinish'
import { useReportClose } from '../../report/useReportClose'
import { formatClock } from '../../time/formatClock'
import { TownReadFailed } from '../../town/TownReadFailed'
import { useLayoutTown } from '../../town/useLayoutTown'

function ReportPage({
  apiClient,
  report,
  receivedAt,
}: {
  readonly apiClient: ApiClient
  readonly report: Report
  readonly receivedAt: Date
}): ReactElement {
  const close = useReportClose(apiClient)
  return (
    <ReportScreen
      dueCount={report.dueCount}
      readFirst={report.readFirst}
      nextReview={
        report.nextDueAt === null ? undefined : formatClock(new Date(report.nextDueAt), receivedAt)
      }
      news={report.news.map((item) => reportNewsRowOf(item, receivedAt))}
      close={{
        isClosed: close.isClosed,
        isWaiting: close.isWaiting,
        refusalLine: close.refusal === undefined ? undefined : refusalLineOf(close.refusal),
        onClose: close.close,
      }}
    />
  )
}

function ReportBody({ apiClient }: { readonly apiClient: ApiClient }): ReactElement {
  const { state, reread } = useReport(apiClient)
  useReportAtLessonFinish(useLayoutTown().state, reread)
  switch (state.kind) {
    case 'loading':
      return (
        <ReportTitled>
          <ReadingLine line={reportLoading()} />
        </ReportTitled>
      )
    case 'refused':
      return (
        <ReportTitled>
          <TownReadFailed refusal={state.refusal} onRetry={reread} />
        </ReportTitled>
      )
    case 'read':
      return (
        <ReportPage apiClient={apiClient} report={state.report} receivedAt={state.receivedAt} />
      )
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

function ReportRoute(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  return (
    <SignOutColumn apiClient={apiClient}>
      <ReportBody apiClient={apiClient} />
    </SignOutColumn>
  )
}

export const Route = createFileRoute('/_signedIn/report')({
  component: ReportRoute,
})
