import type { Reviews, TownOverview } from '@mygame/contracts'
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import type { ReviewEndPath } from '../../review/ReviewEnd'
import { ReviewScreen, type ReviewScreenState } from '../../review/ReviewScreen'
import { type ReviewHandle, useReview } from '../../review/useReview'
import { useReviews } from '../../review/useReviews'
import { lessonNumberOf } from '../../school/lessonCardOf'
import { formatFinish } from '../../time/formatFinish'
import { secondsBetween } from '../../time/secondsBetween'
import { useLayoutTown } from '../../town/useLayoutTown'

interface ReviewRead {
  readonly reviews: Reviews
  readonly arrivalReadFirst: ReadonlyArray<string>
  readonly at: Date
  readonly overview: TownOverview | undefined
}

function nextReviewOf(nextDueAt: string, at: Date): string {
  const remainingSeconds = Math.max(0, secondsBetween(at.toISOString(), nextDueAt))
  return formatFinish(remainingSeconds, at)
}

function pathOf(overview: TownOverview | undefined): ReviewEndPath | undefined {
  if (overview === undefined) {
    return undefined
  }
  const earned = new Set(overview.skills.map(({ lessonId }) => lessonId))
  const lesson = overview.lessons.find(
    ({ id, words }) => !earned.has(id) && words.some(({ standing }) => standing !== 'notStarted'),
  )
  if (lesson === undefined) {
    return undefined
  }
  return {
    lessonNumber: lessonNumberOf(lesson.id, overview),
    standings: lesson.words.map(({ standing }) => standing),
  }
}

function finishedLessonOf(
  card: ReviewHandle['card'],
  { reviews, arrivalReadFirst }: ReviewRead,
): string | undefined {
  if (card === undefined || arrivalReadFirst.includes(card.lessonId)) {
    return undefined
  }
  return reviews.readFirst.includes(card.lessonId) ? card.lessonId : undefined
}

function readStateOf(read: ReviewRead, review: ReviewHandle): ReviewScreenState {
  const finishedLessonId = finishedLessonOf(review.card, read)
  if (finishedLessonId !== undefined) {
    return {
      kind: 'lessonReady',
      lessonId: finishedLessonId,
      lessonNumber:
        read.overview === undefined ? undefined : lessonNumberOf(finishedLessonId, read.overview),
    }
  }
  if (review.card !== undefined) {
    return { kind: 'card', card: review.card, dueCount: review.dueCount, review }
  }
  if (read.reviews.nextDueAt === null) {
    return { kind: 'noCards' }
  }
  return {
    kind: 'nothingDue',
    nextReview: nextReviewOf(read.reviews.nextDueAt, read.at),
    path: pathOf(read.overview),
  }
}

function ReviewPage(): ReactElement {
  const { apiClient } = Route.useRouteContext()
  const { state, reread } = useReviews(apiClient)
  const reviews = state.kind === 'read' ? state.reviews : undefined
  const town = useLayoutTown()
  const overview = town.state.kind === 'live' ? town.state.town.overview : undefined
  const rereadAfterAnswer = async (): Promise<void> => {
    town.reread()
    await reread()
  }
  const review = useReview(apiClient, reviews?.due ?? [], rereadAfterAnswer)
  switch (state.kind) {
    case 'loading':
      return <ReviewScreen state={{ kind: 'loading' }} />
    case 'refused':
      return <ReviewScreen state={{ kind: 'failed', onRetry: () => void reread() }} />
    case 'read':
      return <ReviewScreen state={readStateOf({ ...state, overview }, review)} />
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

export const Route = createFileRoute('/_signedIn/reviews')({
  component: ReviewPage,
})
