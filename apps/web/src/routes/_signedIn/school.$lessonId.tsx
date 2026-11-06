import { reportLoading, townLoading } from '@mygame/catalog'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import { type ReactElement, useEffect, useRef } from 'react'
import { ReadingLine } from '../../design-system/ReadingLine'
import { type ReportHandle, useReport } from '../../report/useReport'
import { LessonWordsScreen, NothingToRead } from '../../school/LessonWordsScreen'
import { lessonWordsOf } from '../../school/lessonWordsOf'
import { useOpenedLessons } from '../../school/useOpenedLessons'
import { wayOnOf } from '../../school/wayOnOf'
import type { LiveTown } from '../../town/liveTown'
import { TownReadFailed } from '../../town/TownReadStatus'
import { useTown } from '../../town/useTown'

function useReportAtLessonFinish(isStudying: boolean, reread: () => void): void {
  const wasStudying = useRef(isStudying)
  useEffect(() => {
    if (wasStudying.current && !isStudying) {
      reread()
    }
    wasStudying.current = isStudying
  }, [isStudying, reread])
}

function LessonPage({
  town,
  lessonId,
  report,
}: {
  readonly town: LiveTown
  readonly lessonId: string
  readonly report: ReportHandle
}): ReactElement {
  const opened = useOpenedLessons(lessonId)
  const { state, reread } = report
  switch (state.kind) {
    case 'loading':
      return <ReadingLine line={reportLoading()} />
    case 'refused':
      return <TownReadFailed refusal={state.refusal} onRetry={reread} />
    case 'read': {
      const lesson = lessonWordsOf(town, lessonId)
      return lesson === undefined ? (
        <NothingToRead />
      ) : (
        <LessonWordsScreen
          key={lessonId}
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

function LessonRoute(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const { lessonId } = Route.useParams()
  const town = useTown(apiClient)
  const report = useReport(apiClient)
  const isStudying = town.state.kind === 'live' && town.state.town.lessonSlot !== null
  useReportAtLessonFinish(isStudying, report.reread)
  switch (town.state.kind) {
    case 'loading':
      return <ReadingLine line={townLoading()} />
    case 'noTown':
      return <Navigate to="/" />
    case 'refused':
      return <TownReadFailed refusal={town.state.refusal} onRetry={town.reread} />
    case 'live':
      return <LessonPage town={town.state.town} lessonId={lessonId} report={report} />
    default: {
      const unreachable: never = town.state
      return unreachable
    }
  }
}

export const Route = createFileRoute('/_signedIn/school/$lessonId')({
  component: LessonRoute,
})
