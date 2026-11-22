import type { LessonCatalog } from '#learning/curriculum/ports/LessonCatalog'
import type { Lesson } from '#learning/Lesson'
import { type ChromePhase, chromePhaseOf } from '#learning/scaffold/chromePhaseOf'
import type { Clock } from '#platform/domain/Clock'
import { isLessonFinishedBy } from '#town/school/isLessonFinishedBy'
import type { StoredPlayer } from '../domain/Accounts'
import type { ChromeProgress, ChromeProgressReader } from '../domain/ChromeProgressReader'

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

export class ReadChromePhase {
  constructor(private readonly dependencies: ReadChromePhaseDependencies) {}

  async execute({ id, scaffold }: StoredPlayer): Promise<ChromePhase> {
    const progress = await this.dependencies.chromeProgress.chromeProgressOf(id)
    if (progress === undefined) {
      throw new Error(`Player ${id} holds no account`)
    }
    const cards = [...progress.cards, ...finishedLessonCardsOf(progress, this.dependencies)]
    return chromePhaseOf(
      scaffold,
      this.dependencies.lessons.chromeLessons(),
      cards,
      progress.skills,
    )
  }
}
