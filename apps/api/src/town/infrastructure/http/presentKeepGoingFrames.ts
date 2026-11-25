import type { KeepGoingFrames } from '@mygame/contracts'
import type { DomainError, LessonLibrary, MemoryTerms, Result, TownReading } from '@mygame/domain'
import { heldCardsOf, keepGoingWordsOf, ok, placedOutBandsOf, stageOf } from '@mygame/domain'

export const presentKeepGoingFrames = (
  { cards, placementScores, scaffold, at }: TownReading,
  lessons: LessonLibrary,
  memoryTerms: MemoryTerms,
): Result<KeepGoingFrames, DomainError> => {
  const placedOutBands = placedOutBandsOf(placementScores)
  const stage = stageOf(lessons.lessons(), cards, placedOutBands, lessons)
  const learner = { cards: heldCardsOf(cards), placedOutBands, scaffold, stage, lessons }
  const words = keepGoingWordsOf(learner, at, {
    memory: memoryTerms,
    keepGoing: lessons.keepGoingTerms(),
  })
  if (!words.ok) {
    return words
  }
  return ok({
    words: words.value.map(({ wordId, frames }) => ({
      wordId,
      frames: frames.map((spans) => [...spans]),
    })),
  })
}
