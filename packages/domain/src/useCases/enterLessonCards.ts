import type { DomainError } from '../DomainError'
import type { HeldCard } from '../learning/HeldCard'
import { holdsLessonCards } from '../learning/holdsLessonCards'
import type { LessonId } from '../learning/Lesson'
import { lessonCardsEnteredAt } from '../learning/lessonCardsEnteredAt'
import type { PlayerId } from '../player/PlayerId'
import type { CardRepository } from '../ports/CardRepository'
import type { LessonCatalog } from '../ports/LessonCatalog'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'

export type EnterLessonCardsCommand = {
  readonly playerId: PlayerId
  readonly lessonId: LessonId
  readonly enteredAt: Instant
}

export type EnterLessonCardsDependencies = {
  readonly cards: CardRepository
  readonly lessons: Pick<LessonCatalog, 'lessonOf'>
}

export const enterLessonCards = async (
  { playerId, lessonId, enteredAt }: EnterLessonCardsCommand,
  { cards, lessons }: EnterLessonCardsDependencies,
): Promise<Result<ReadonlyArray<HeldCard>, DomainError>> => {
  const lesson = lessons.lessonOf(lessonId)
  if (lesson === undefined) {
    return err({ kind: 'LessonNotFound', lessonId })
  }
  const held = await cards.cardsOf(playerId)
  if (!held.ok) {
    return held
  }
  if (holdsLessonCards(lesson, held.value)) {
    return ok([])
  }
  const entered = lessonCardsEnteredAt(lesson, enteredAt)
  for (const card of entered) {
    const saved = await cards.save(playerId, card)
    if (!saved.ok) {
      return saved
    }
  }
  return ok(entered)
}
