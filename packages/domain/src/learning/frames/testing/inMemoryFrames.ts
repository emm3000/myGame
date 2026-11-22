import type { WordId } from '../../domain/Lesson'
import type { FrameCatalog } from '../domain/FrameCatalog'
import type { FrameToken } from '../domain/FrameToken'

export type ResolvedFrame = {
  readonly wordId: WordId
  readonly frame: string
  readonly tokens: ReadonlyArray<FrameToken>
}

export const inMemoryFrames = (
  frames: ReadonlyArray<ResolvedFrame>,
  answerForms: ReadonlyMap<WordId, ReadonlySet<string>>,
): FrameCatalog => ({
  frameTokensOf: (wordId, frame) =>
    frames.find((resolved) => resolved.wordId === wordId && resolved.frame === frame)?.tokens,
  answerFormsOf: (wordId) => answerForms.get(wordId) ?? new Set(),
})
