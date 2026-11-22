import type { LessonLibrary } from '#content/domain/LessonLibrary'
import type { DomainError } from '#DomainError'
import type { MemoryTerms } from '#memory/domain/MemoryTerms'
import type { PlayerId } from '#player/PlayerId'
import type { Result } from '#Result'
import { type MutateTownDependencies, mutateTown } from '#town/application/mutateTown'
import type { WordId } from '../../domain/Lesson'
import { type Hint, requestHint } from './requestHint'

export type RequestReviewHintCommand = {
  readonly playerId: PlayerId
  readonly wordId: WordId
}

export type RequestReviewHintDependencies = MutateTownDependencies & {
  readonly lessons: LessonLibrary
  readonly memoryTerms: MemoryTerms
}

export class RequestReviewHint {
  constructor(private readonly dependencies: RequestReviewHintDependencies) {}

  async execute({
    playerId,
    wordId,
  }: RequestReviewHintCommand): Promise<Result<Hint, DomainError>> {
    const { lessons, memoryTerms } = this.dependencies
    return mutateTown(
      playerId,
      ({ cards, pendingReviews }, clock) =>
        requestHint(
          { playerId, wordId },
          { cards, pendingReviews, lessons, clock, terms: memoryTerms },
        ),
      this.dependencies,
    )
  }
}
