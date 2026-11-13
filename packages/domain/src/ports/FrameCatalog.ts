import type { FrameToken } from '../learning/FrameToken'
import type { WordId } from '../learning/Lesson'

export interface FrameCatalog {
  frameTokensOf(wordId: WordId, frame: string): ReadonlyArray<FrameToken> | undefined
  answerFormsOf(wordId: WordId): ReadonlySet<string>
}
