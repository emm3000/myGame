import type { Report } from '@mygame/contracts'
import {
  type Clock,
  type DomainError,
  dueCardsAt,
  err,
  type Instant,
  ok,
  type PlayerId,
  type Result,
  readFirstOf,
  resolveTown,
  type TownCatalog,
  type TownEvent,
} from '@mygame/domain'
import type { Refusal } from '../http/Refusal'
import { learnerOf } from '../learning/learnerOf'
import { type ReviewTerms, reviewsOf } from '../learning/reviewsOf'
import { type MutateTownDependencies, mutateTown, type TownStores } from './mutateTown'
import type { ReportClosings } from './ReportClosings'
import { townNewsItemOf } from './townNewsItemOf'

export type ReportDependencies = MutateTownDependencies &
  ReviewTerms & {
    readonly reportClosings: ReportClosings
    readonly townCatalog: TownCatalog
  }

const newsSinceOf = async (
  playerId: PlayerId,
  closedAt: Instant,
  stores: TownStores,
  clock: Clock,
  catalog: TownCatalog,
): Promise<Result<ReadonlyArray<TownEvent>, DomainError>> => {
  const resolved = await resolveTown(playerId, {
    towns: stores.towns,
    news: stores.townNews,
    catalog,
    clock,
  })
  if (!resolved.ok) {
    return resolved.error.kind === 'TownNotFound' ? ok([]) : resolved
  }
  return ok(await stores.townNews.newsAfter(resolved.value.town.id, closedAt))
}

export const reportOf = async (
  playerId: PlayerId,
  dependencies: ReportDependencies,
): Promise<Result<Report, Refusal>> => {
  const closedAt = await dependencies.reportClosings.closedAt(playerId)
  if (closedAt === undefined) {
    return err({ kind: 'SignedOut' })
  }
  return mutateTown(
    playerId,
    async (stores, clock) => {
      const learner = await learnerOf(playerId, stores)
      if (!learner.ok) {
        return learner
      }
      const readAt = clock.now()
      const reviews = reviewsOf(learner.value, readAt, dependencies)
      if (!reviews.ok) {
        return reviews
      }
      const dueCards = dueCardsAt(learner.value.cards, readAt, dependencies.memoryTerms)
      if (!dueCards.ok) {
        return dueCards
      }
      const news = await newsSinceOf(playerId, closedAt, stores, clock, dependencies.townCatalog)
      if (!news.ok) {
        return news
      }
      const { due, nextDueAt } = reviews.value
      return ok({
        dueCount: due.length,
        due,
        readFirst: [...readFirstOf(dependencies.lessons.lessons(), dueCards.value)],
        nextDueAt,
        news: news.value.map(townNewsItemOf),
      })
    },
    dependencies,
  )
}
