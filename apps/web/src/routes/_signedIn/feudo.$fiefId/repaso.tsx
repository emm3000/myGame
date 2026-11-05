import type { Reviews } from '@mygame/contracts'
import { createFileRoute } from '@tanstack/react-router'
import { type ReactElement, useEffect } from 'react'
import { useLayoutFief } from '../../../fief/useLayoutFief'
import { ReviewScreen, type ReviewScreenState } from '../../../review/ReviewScreen'
import { type ReviewHandle, useReview } from '../../../review/useReview'
import { useReviews } from '../../../review/useReviews'
import { formatFinish } from '../../../time/formatFinish'
import { secondsBetween } from '../../../time/secondsBetween'

function nextReviewOf(nextDueAt: string, at: Date | undefined): string | undefined {
  if (at === undefined) {
    return undefined
  }
  const remainingSeconds = Math.max(0, secondsBetween(at.toISOString(), nextDueAt))
  return formatFinish(remainingSeconds, at)
}

function readStateOf(
  reviews: Reviews,
  review: ReviewHandle,
  at: Date | undefined,
): ReviewScreenState {
  if (review.card !== undefined) {
    return { kind: 'card', card: review.card, dueCount: review.dueCount, review }
  }
  if (reviews.nextDueAt === null) {
    return { kind: 'noCards' }
  }
  return { kind: 'nothingDue', nextReview: nextReviewOf(reviews.nextDueAt, at) }
}

function isNextReviewDue(reviews: Reviews | undefined, at: Date | undefined): boolean {
  if (reviews === undefined || at === undefined || reviews.nextDueAt === null) {
    return false
  }
  return reviews.due.length === 0 && Date.parse(reviews.nextDueAt) <= at.getTime()
}

function ReviewPage(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const layout = useLayoutFief()
  const { state, reread } = useReviews(apiClient)
  const reviews = state.kind === 'read' ? state.reviews : undefined
  const review = useReview(apiClient, reviews?.due ?? [], reread)
  const at = layout.state.kind === 'live' ? layout.state.fief.at : undefined
  const isDue = isNextReviewDue(reviews, at)
  useEffect(() => {
    if (isDue) {
      void reread()
    }
  }, [isDue, reread])
  switch (state.kind) {
    case 'loading':
      return <ReviewScreen state={{ kind: 'loading' }} />
    case 'refused':
      return <ReviewScreen state={{ kind: 'failed', onRetry: () => void reread() }} />
    case 'read':
      return <ReviewScreen state={readStateOf(state.reviews, review, at)} />
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

export const Route = createFileRoute('/_signedIn/feudo/$fiefId/repaso')({
  component: ReviewPage,
})
