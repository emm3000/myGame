import { reportLoading } from '@mygame/catalog'
import type { Report } from '@mygame/contracts'
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import type { ApiClient } from '../../api/apiClient'
import { SignOutColumn } from '../../auth/SignOutColumn'
import { LoadingSkeleton, type LoadingSkeletonProps } from '../../design-system/LoadingSkeleton'
import { newsRowOf } from '../../news/newsRowOf'
import { refusalLineOf } from '../../refusals/refusalLineOf'
import { ReportScreen, ReportTitled } from '../../report/ReportScreen'
import { type ReportHandle, useReport } from '../../report/useReport'
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
      news={report.news.map((item) => newsRowOf(item, receivedAt))}
      close={{
        isClosed: close.isClosed,
        isWaiting: close.isWaiting,
        refusalLine: close.refusal === undefined ? undefined : refusalLineOf(close.refusal),
        onClose: close.close,
      }}
    />
  )
}

const reportSkeletonGroups: LoadingSkeletonProps['groups'] = [
  ['thumbnail', 'action', 'control', 'control', 'control'],
]

function ReportAnswer({
  apiClient,
  report,
}: {
  readonly apiClient: ApiClient
  readonly report: ReportHandle
}): ReactElement | null {
  const { state, reread } = report
  switch (state.kind) {
    case 'loading':
      return null
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

function ReportBody({ apiClient }: { readonly apiClient: ApiClient }): ReactElement {
  const report = useReport(apiClient)
  useReportAtLessonFinish(useLayoutTown().state, report.reread)
  return (
    <LoadingSkeleton
      isLoading={report.state.kind === 'loading'}
      line={reportLoading()}
      groups={reportSkeletonGroups}
      Frame={ReportTitled}
    >
      <ReportAnswer apiClient={apiClient} report={report} />
    </LoadingSkeleton>
  )
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
