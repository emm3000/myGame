import { reportLoading, townLoading } from '@mygame/catalog'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import type { ReactElement, ReactNode } from 'react'
import { LoadingSkeleton, type LoadingSkeletonProps } from '../../design-system/LoadingSkeleton'
import { type ReportHandle, useReport } from '../../report/useReport'
import { useReportAtLessonFinish } from '../../report/useReportAtLessonFinish'
import { LessonWordsScreen } from '../../school/LessonWordsScreen'
import { lessonWordsOf } from '../../school/lessonWordsOf'
import { NothingToRead } from '../../school/NothingToRead'
import { SchoolTitled } from '../../school/SchoolTitled'
import { useOpenedLessons } from '../../school/useOpenedLessons'
import { wayOnOf } from '../../school/wayOnOf'
import type { LiveTown } from '../../town/liveTown'
import { TownReadFailed } from '../../town/TownReadFailed'
import { useLayoutTown } from '../../town/useLayoutTown'
import type { TownHandle } from '../../town/useTown'

function LessonPage({
  town,
  lessonId,
  report,
}: {
  readonly town: LiveTown
  readonly lessonId: string
  readonly report: ReportHandle
}): ReactElement | null {
  const opened = useOpenedLessons(lessonId)
  const { state, reread } = report
  switch (state.kind) {
    case 'loading':
      return null
    case 'refused':
      return (
        <SchoolTitled>
          <TownReadFailed refusal={state.refusal} onRetry={reread} />
        </SchoolTitled>
      )
    case 'read': {
      const lesson = lessonWordsOf(town, lessonId)
      return lesson === undefined ? (
        <NothingToRead />
      ) : (
        <LessonWordsScreen
          lessonId={lessonId}
          lesson={lesson}
          wayOn={wayOnOf(state.report.readFirst, opened)}
        />
      )
    }
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

const lessonSkeletonGroups: LoadingSkeletonProps['groups'] = [['control', 'place-card', 'action']]

function LessonSkeletonFrame({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <div className="mx-auto w-full max-w-form">
      <SchoolTitled>{children}</SchoolTitled>
    </div>
  )
}

function LessonAnswer({
  town,
  lessonId,
  report,
}: {
  readonly town: TownHandle
  readonly lessonId: string
  readonly report: ReportHandle
}): ReactElement | null {
  switch (town.state.kind) {
    case 'loading':
      return null
    case 'noTown':
      return <Navigate to="/" />
    case 'refused':
      return (
        <SchoolTitled>
          <TownReadFailed refusal={town.state.refusal} onRetry={town.reread} />
        </SchoolTitled>
      )
    case 'live':
      return <LessonPage town={town.state.town} lessonId={lessonId} report={report} />
    default: {
      const unreachable: never = town.state
      return unreachable
    }
  }
}

function LessonRoute(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const { lessonId } = Route.useParams()
  const town = useLayoutTown()
  const report = useReport(apiClient)
  useReportAtLessonFinish(town.state, report.reread)
  const isTownLoading = town.state.kind === 'loading'
  const isReportLoading = town.state.kind === 'live' && report.state.kind === 'loading'
  return (
    <LoadingSkeleton
      isLoading={isTownLoading || isReportLoading}
      line={isTownLoading ? townLoading() : reportLoading()}
      groups={lessonSkeletonGroups}
      Frame={LessonSkeletonFrame}
    >
      <LessonAnswer town={town} lessonId={lessonId} report={report} />
    </LoadingSkeleton>
  )
}

export const Route = createFileRoute('/_signedIn/school/$lessonId')({
  component: LessonRoute,
})
