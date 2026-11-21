import type { Report, Reviews } from '@mygame/contracts'
import {
  type Clock,
  type DomainError,
  err,
  type Instant,
  ok,
  type PlayerId,
  type Result,
  type TownEvent,
  type TownId,
} from '@mygame/domain'
import { type ReviewTerms, reviewsOf } from '../learning/reviewsOf'
import type { Refusal } from '../platform/application/Refusal'
import { type CurrentTownDependencies, currentTownOf } from './currentTownOf'
import type { ReportClosings } from './ReportClosings'
import type { TownNewsReader } from './TownNewsReader'
import { townNewsItemOf } from './townNewsItemOf'

export type ReportDependencies = CurrentTownDependencies &
  ReviewTerms & {
    readonly reportClosings: ReportClosings
  }

type ReportTown = {
  readonly at: Instant
  readonly townId: TownId | undefined
}

type ReportShown = {
  readonly reviews: Reviews
  readonly news: ReadonlyArray<TownEvent>
}

const reportTownOf = async (
  playerId: PlayerId,
  dependencies: ReportDependencies,
): Promise<Result<ReportTown, DomainError>> => {
  const reading = await currentTownOf(playerId, dependencies)
  if (!reading.ok) {
    return reading.error.kind === 'TownNotFound'
      ? ok({ at: dependencies.clock.now(), townId: undefined })
      : reading
  }
  return ok({ at: reading.value.at, townId: reading.value.town.id })
}

const newsBetween = async (
  closedAt: Instant,
  { at, townId }: ReportTown,
  townNews: TownNewsReader,
): Promise<ReadonlyArray<TownEvent>> => {
  if (townId === undefined) {
    return []
  }
  const news = await townNews.newsAfter(townId, closedAt)
  return news.filter(({ occurredAt }) => occurredAt.epochMilliseconds <= at.epochMilliseconds)
}

const shownAt = (
  playerId: PlayerId,
  closedAt: Instant,
  town: ReportTown,
  dependencies: ReportDependencies,
): Promise<Result<ReportShown, DomainError>> => {
  const readClock: Clock = { now: () => town.at }
  return dependencies.inTransaction(async (stores) => {
    await stores.accounts.lockPlayer(playerId)
    const reviews = await reviewsOf(playerId, stores, readClock, dependencies)
    if (!reviews.ok) {
      return reviews
    }
    const news = await newsBetween(closedAt, town, stores.townNews)
    return ok({ reviews: reviews.value, news })
  })
}

export const reportOf = async (
  playerId: PlayerId,
  dependencies: ReportDependencies,
): Promise<Result<Report, Refusal>> => {
  const closedAt = await dependencies.reportClosings.closedAt(playerId)
  if (closedAt === undefined) {
    return err({ kind: 'SignedOut' })
  }
  const town = await reportTownOf(playerId, dependencies)
  if (!town.ok) {
    return town
  }
  const shown = await shownAt(playerId, closedAt, town.value, dependencies)
  if (!shown.ok) {
    return shown
  }
  await dependencies.reportClosings.serve(playerId, town.value.at)
  const { due, readFirst, nextDueAt, readAt } = shown.value.reviews
  return ok({
    dueCount: due.length,
    due,
    readFirst,
    nextDueAt,
    readAt,
    news: shown.value.news.map(townNewsItemOf),
  })
}
