import type { WordId } from '../../domain/Lesson'
import type { FrameToken } from './FrameToken'

export interface FrameCatalog {
  frameTokensOf(wordId: WordId, frame: string): ReadonlyArray<FrameToken> | undefined
  answerFormsOf(wordId: WordId): ReadonlySet<string>
}
