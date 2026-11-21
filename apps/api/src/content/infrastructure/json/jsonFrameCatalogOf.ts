import type { FrameCatalog } from '@mygame/domain'
import type { LessonShelf } from './LessonShelf'

export const jsonFrameCatalogOf = ({ resolvedFrames }: LessonShelf): FrameCatalog => ({
  frameTokensOf: (wordId, frame) => resolvedFrames.tokens.get(wordId)?.get(frame),
  answerFormsOf: (wordId) => resolvedFrames.answerForms.get(wordId) ?? new Set(),
})
