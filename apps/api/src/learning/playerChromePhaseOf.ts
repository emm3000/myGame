import { type ChromePhase, type Clock, chromePhaseOf, isLessonFinishedBy } from '@mygame/domain'
import type { StoredPlayer } from '../auth/Accounts'
import type { ChromeProgress, ChromeProgressReader } from './ChromeProgressReader'
import type { LessonLibrary } from './LessonLibrary'

export type PlayerChromePhaseDependencies = {
  readonly chromeProgress: ChromeProgressReader
  readonly lessons: Pick<LessonLibrary, 'chromeLessons' | 'lessonOf'>
  readonly clock: Clock
}

const finishedLessonCardsOf = (
  { lessonSlot }: ChromeProgress,
  { lessons, clock }: PlayerChromePhaseDependencies,
): ChromeProgress['cards'] => {
  if (lessonSlot === null || !isLessonFinishedBy(lessonSlot, clock.now())) {
    return []
  }
  const words = lessons.lessonOf(lessonSlot.lessonId)?.words ?? []
  return words.map(({ id }) => ({ wordId: id }))
}

export const playerChromePhaseOf = async (
  { id, scaffold }: StoredPlayer,
  dependencies: PlayerChromePhaseDependencies,
): Promise<ChromePhase> => {
  const progress = await dependencies.chromeProgress.chromeProgressOf(id)
  if (progress === undefined) {
    throw new Error(`Player ${id} holds no account`)
  }
  const cards = [...progress.cards, ...finishedLessonCardsOf(progress, dependencies)]
  return chromePhaseOf(scaffold, dependencies.lessons.chromeLessons(), cards, progress.skills)
}
