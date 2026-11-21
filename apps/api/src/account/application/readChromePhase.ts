import {
  type ChromePhase,
  type Clock,
  chromePhaseOf,
  isLessonFinishedBy,
  type Lesson,
  type LessonCatalog,
} from '@mygame/domain'
import type { StoredPlayer } from './ports/Accounts'
import type { ChromeProgress, ChromeProgressReader } from './ports/ChromeProgressReader'

export type ReadChromePhaseDependencies = {
  readonly chromeProgress: ChromeProgressReader
  readonly lessons: Pick<LessonCatalog, 'lessonOf'> & {
    chromeLessons(): ReadonlyArray<Lesson>
  }
  readonly clock: Clock
}

const finishedLessonCardsOf = (
  { lessonSlot }: ChromeProgress,
  { lessons, clock }: ReadChromePhaseDependencies,
): ChromeProgress['cards'] => {
  if (lessonSlot === null || !isLessonFinishedBy(lessonSlot, clock.now())) {
    return []
  }
  const words = lessons.lessonOf(lessonSlot.lessonId)?.words ?? []
  return words.map(({ id }) => ({ wordId: id }))
}

export const readChromePhase = async (
  { id, scaffold }: StoredPlayer,
  dependencies: ReadChromePhaseDependencies,
): Promise<ChromePhase> => {
  const progress = await dependencies.chromeProgress.chromeProgressOf(id)
  if (progress === undefined) {
    throw new Error(`Player ${id} holds no account`)
  }
  const cards = [...progress.cards, ...finishedLessonCardsOf(progress, dependencies)]
  return chromePhaseOf(scaffold, dependencies.lessons.chromeLessons(), cards, progress.skills)
}
