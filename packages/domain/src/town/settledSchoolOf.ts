import type { DomainError } from '../DomainError'
import type { HeldCard } from '../learning/HeldCard'
import type { PlayerId } from '../player/PlayerId'
import type { CardRepository } from '../ports/CardRepository'
import type { LessonCatalog } from '../ports/LessonCatalog'
import { ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import type { LessonSlot } from './LessonSlot'
import type { LessonSlotRepository } from './LessonSlotRepository'
import { type SettledLessonSlot, settledLessonSlot } from './settledLessonSlot'
import type { TownId } from './TownId'

export type SettledSchool = SettledLessonSlot & {
  readonly stored: LessonSlot
  readonly held: ReadonlyArray<HeldCard>
}

export type SettledSchoolSources = {
  readonly lessonSlots: LessonSlotRepository
  readonly cards: CardRepository
  readonly lessons: Pick<LessonCatalog, 'lessonOf'>
}

export const settledSchoolOf = async (
  playerId: PlayerId,
  townId: TownId,
  { lessonSlots, cards, lessons }: SettledSchoolSources,
  now: Instant,
): Promise<Result<SettledSchool, DomainError>> => {
  const held = await cards.cardsOf(playerId)
  if (!held.ok) {
    return held
  }
  const stored = await lessonSlots.lessonSlotOf(townId)
  if (!stored.ok) {
    return stored
  }
  const settled = settledLessonSlot(stored.value, held.value, lessons, now)
  return ok({ ...settled, stored: stored.value, held: [...held.value, ...settled.entered] })
}
