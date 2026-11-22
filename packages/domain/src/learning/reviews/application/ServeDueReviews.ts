import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import type { Result } from '#Result'
import { type MutateTownDependencies, mutateTown } from '#town/application/mutateTown'
import { type DueReviews, type ReviewTerms, readDueReviews } from './readDueReviews'

export type ServeDueReviewsQuery = {
  readonly playerId: PlayerId
}

export type ServeDueReviewsDependencies = MutateTownDependencies & ReviewTerms

export class ServeDueReviews {
  constructor(private readonly dependencies: ServeDueReviewsDependencies) {}

  async execute({ playerId }: ServeDueReviewsQuery): Promise<Result<DueReviews, DomainError>> {
    return mutateTown(
      playerId,
      (stores, clock) => readDueReviews(playerId, stores, clock, this.dependencies),
      this.dependencies,
    )
  }
}
