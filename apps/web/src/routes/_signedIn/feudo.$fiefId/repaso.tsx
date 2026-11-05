import type { Reviews } from '@mygame/contracts'
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { ReviewScreen, type ReviewScreenState } from '../../../review/ReviewScreen'
import { type ReviewHandle, useReview } from '../../../review/useReview'
import { useReviews } from '../../../review/useReviews'
import { formatFinish } from '../../../time/formatFinish'
import { secondsBetween } from '../../../time/secondsBetween'

function nextReviewOf(nextDueAt: string, at: Date): string {
  const remainingSeconds = Math.max(0, secondsBetween(at.toISOString(), nextDueAt))
  return formatFinish(remainingSeconds, at)
}

function readStateOf(reviews: Reviews, review: ReviewHandle, at: Date): ReviewScreenState {
  if (review.card !== undefined) {
    return { kind: 'card', card: review.card, dueCount: review.dueCount, review }
  }
  if (reviews.nextDueAt === null) {
    return { kind: 'noCards' }
  }
  return { kind: 'nothingDue', nextReview: nextReviewOf(reviews.nextDueAt, at) }
}

function ReviewPage(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const { state, reread } = useReviews(apiClient)
  const reviews = state.kind === 'read' ? state.reviews : undefined
  const review = useReview(apiClient, reviews?.due ?? [], reread)
  switch (state.kind) {
    case 'loading':
      return <ReviewScreen state={{ kind: 'loading' }} />
    case 'refused':
      return <ReviewScreen state={{ kind: 'failed', onRetry: () => void reread() }} />
    case 'read':
      return <ReviewScreen state={readStateOf(state.reviews, review, state.at)} />
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

export const Route = createFileRoute('/_signedIn/feudo/$fiefId/repaso')({
  component: ReviewPage,
})
