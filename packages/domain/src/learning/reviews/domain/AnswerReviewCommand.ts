import type { PlayerId } from '#player/PlayerId'
import type { WordId } from '../../domain/Lesson'

export type AnswerReviewCommand = {
  readonly playerId: PlayerId
  readonly wordId: WordId
  readonly answer: string
}
