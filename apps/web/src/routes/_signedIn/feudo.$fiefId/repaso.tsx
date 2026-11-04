import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import type { LiveFief } from '../../../fief/liveFief'
import { useLayoutFief } from '../../../fief/useLayoutFief'
import { ReviewScreen, type ReviewScreenState } from '../../../review/ReviewScreen'
import { type ReviewHandle, useReview } from '../../../review/useReview'
import { formatFinish } from '../../../time/formatFinish'
import { secondsBetween } from '../../../time/secondsBetween'

function nextReviewOf(fief: LiveFief): string | undefined {
  const { nextDueAt } = fief.overview.reviews
  if (nextDueAt === null) {
    return undefined
  }
  const remainingSeconds = Math.max(0, secondsBetween(fief.at.toISOString(), nextDueAt))
  return formatFinish(remainingSeconds, fief.at)
}

function liveStateOf(fief: LiveFief, review: ReviewHandle): ReviewScreenState {
  const { overview } = fief
  if (review.card !== undefined) {
    return {
      kind: 'card',
      card: review.card,
      dueCount: overview.reviews.due.length,
      skills: overview.skills,
      review,
    }
  }
  if (!overview.lessons.some((lesson) => lesson.isStudied)) {
    return { kind: 'noCards' }
  }
  return { kind: 'nothingDue', nextReview: nextReviewOf(fief) }
}

function ReviewPage(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const { fiefId } = Route.useParams()
  const { state, adopt, reread } = useLayoutFief()
  const due = state.kind === 'live' ? state.fief.overview.reviews.due : []
  const review = useReview(apiClient, fiefId, due, adopt)
  switch (state.kind) {
    case 'loading':
      return <ReviewScreen state={{ kind: 'loading' }} />
    case 'refused':
      return <ReviewScreen state={{ kind: 'failed', onRetry: reread }} />
    case 'live':
      return <ReviewScreen state={liveStateOf(state.fief, review)} />
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

export const Route = createFileRoute('/_signedIn/feudo/$fiefId/repaso')({
  component: ReviewPage,
})
