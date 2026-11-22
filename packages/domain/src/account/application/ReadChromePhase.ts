import type { LessonCatalog } from '#learning/curriculum/domain/LessonCatalog'
import type { Lesson } from '#learning/domain/Lesson'
import { type ChromePhase, chromePhaseOf } from '#learning/scaffold/domain/chromePhaseOf'
import type { Clock } from '#platform/domain/Clock'
import type { Refusal } from '#platform/domain/Refusal'
import { err, ok, type Result } from '#Result'
import { isLessonFinishedBy } from '#town/school/domain/isLessonFinishedBy'
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

  async execute({ id, scaffold }: StoredPlayer): Promise<Result<ChromePhase, Refusal>> {
    const progress = await this.dependencies.chromeProgress.chromeProgressOf(id)
    if (progress === undefined) {
      return err({ kind: 'SignedOut' })
    }
    const cards = [...progress.cards, ...finishedLessonCardsOf(progress, this.dependencies)]
    return ok(
      chromePhaseOf(scaffold, this.dependencies.lessons.chromeLessons(), cards, progress.skills),
    )
  }
}
