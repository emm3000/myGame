import type { Report } from '@mygame/contracts/town'
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import type { ApiClient } from '../../api/apiClient'
import { refusalLineOf } from '../../refusals/refusalLineOf'
import { ReportReading } from '../../report/ReportReading'
import { ReportScreen } from '../../report/ReportScreen'
import { reportNewsRowOf } from '../../report/reportNewsRowOf'
import { useReport } from '../../report/useReport'
import { useReportClose } from '../../report/useReportClose'
import { TownReadFailed } from '../../town/TownReadStatus'

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

function ReportRoute(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const { state, reread } = useReport(apiClient)
  switch (state.kind) {
    case 'loading':
      return <ReportReading />
    case 'refused':
      return <TownReadFailed refusal={state.refusal} onRetry={reread} />
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

export const Route = createFileRoute('/_signedIn/report')({
  component: ReportRoute,
})
