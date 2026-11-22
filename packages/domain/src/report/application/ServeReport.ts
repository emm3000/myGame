import type { DomainError } from '#DomainError'
import { type ReviewTerms, readDueReviews } from '#learning/reviews/application/readDueReviews'
import type { DueReviews } from '#learning/reviews/domain/DueReviews'
import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import {
  type ResolveTownReadingDependencies,
  resolveTownReading,
} from '#town/application/resolveTownReading'
import type { TownEvent } from '#town/domain/TownEvent'
import type { TownId } from '#town/domain/TownId'
import type { TownNewsReader } from '#town/domain/TownNewsReader'
import type { ReportClosings } from '../domain/ReportClosings'

export type ServeReportQuery = {
  readonly playerId: PlayerId
}

export type ServeReportDependencies = ResolveTownReadingDependencies &
  ReviewTerms & {
    readonly reportClosings: ReportClosings
  }

export type ServedReport = {
  readonly reviews: DueReviews
  readonly news: ReadonlyArray<TownEvent>
}

export type ReportNotServed = DomainError | { readonly kind: 'SignedOut' }

type ReportTown = {
  readonly at: Instant
  readonly townId: TownId | undefined
}

const readReportTown = async (
  playerId: PlayerId,
  dependencies: ServeReportDependencies,
): Promise<Result<ReportTown, DomainError>> => {
  const reading = await resolveTownReading(playerId, dependencies)
  if (!reading.ok) {
    return reading.error.kind === 'TownNotFound'
      ? ok({ at: dependencies.clock.now(), townId: undefined })
      : reading
  }
  return ok({ at: reading.value.at, townId: reading.value.town.id })
}

const readReportNews = async (
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

const showReport = (
  playerId: PlayerId,
  closedAt: Instant,
  town: ReportTown,
  dependencies: ServeReportDependencies,
): Promise<Result<ServedReport, DomainError>> => {
  const readClock: Clock = { now: () => town.at }
  return dependencies.unitOfWork.transact(async (stores) => {
    await stores.accounts.lockPlayer(playerId)
    const reviews = await readDueReviews(playerId, stores, readClock, dependencies)
    if (!reviews.ok) {
      return reviews
    }
    const news = await readReportNews(closedAt, town, stores.townNews)
    return ok({ reviews: reviews.value, news })
  })
}

export class ServeReport {
  constructor(private readonly dependencies: ServeReportDependencies) {}

  async execute({ playerId }: ServeReportQuery): Promise<Result<ServedReport, ReportNotServed>> {
    const closedAt = await this.dependencies.reportClosings.closedAt(playerId)
    if (closedAt === undefined) {
      return err({ kind: 'SignedOut' })
    }
    const town = await readReportTown(playerId, this.dependencies)
    if (!town.ok) {
      return town
    }
    const shown = await showReport(playerId, closedAt, town.value, this.dependencies)
    if (!shown.ok) {
      return shown
    }
    await this.dependencies.reportClosings.serve(playerId, town.value.at)
    return shown
  }
}
