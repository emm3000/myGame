import type { FrameToken } from '../learning/FrameToken'
import type { WordId } from '../learning/Lesson'
import type { FrameCatalog } from '../ports/FrameCatalog'

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
