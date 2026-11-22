import type { DomainError } from '#DomainError'
import type { BandStart } from '#holdout/BandStart'
import type { BandStartRepository } from '#holdout/ports/BandStartRepository'
import { type ReleaseContent, releasedLessonsOf } from '#holdout/releasedLessonsOf'
import type { LessonCatalog } from '#learning/curriculum/ports/LessonCatalog'
import type { HeldCard } from '#learning/HeldCard'
import type { CardRepository } from '#learning/ports/CardRepository'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import type { TownId } from '../../domain/TownId'
import type { LessonSlot } from '../domain/LessonSlot'
import type { LessonSlotRepository } from '../domain/LessonSlotRepository'
import type { SchoolLesson } from '../domain/SchoolLesson'
import { schoolLessonsOf } from '../domain/schoolLessonsOf'
import { type SettledLessonSlot, settledLessonSlot } from '../domain/settledLessonSlot'

export type SettledSchool = SettledLessonSlot & {
  readonly stored: LessonSlot
  readonly held: ReadonlyArray<HeldCard>
  readonly bandStarts: ReadonlyArray<BandStart>
  readonly released: ReadonlyArray<SchoolLesson>
}

export type SettledSchoolSources = ReleaseContent & {
  readonly lessonSlots: LessonSlotRepository
  readonly cards: CardRepository
  readonly bandStarts: Pick<BandStartRepository, 'bandStartsOf'>
  readonly lessons: Pick<LessonCatalog, 'lessonOf' | 'lessonOfWord'>
}

export const readSettledSchool = async (
  playerId: PlayerId,
  townId: TownId,
  sources: SettledSchoolSources,
  now: Instant,
): Promise<Result<SettledSchool, DomainError>> => {
  const { lessonSlots, cards, bandStarts, lessons } = sources
  const held = await cards.cardsOf(playerId)
  if (!held.ok) {
    return held
  }
  const stored = await lessonSlots.lessonSlotOf(townId)
  if (!stored.ok) {
    return stored
  }
  const starts = await bandStarts.bandStartsOf(playerId)
  if (!starts.ok) {
    return starts
  }
  const releasedBefore = releasedLessonsOf(starts.value, held.value, sources)
  const settled = settledLessonSlot(
    stored.value,
    held.value,
    starts.value,
    schoolLessonsOf(lessons, releasedBefore),
    now,
  )
  const settledHeld = [...held.value, ...settled.entered]
  return ok({
    ...settled,
    stored: stored.value,
    held: settledHeld,
    bandStarts: starts.value,
    released: releasedLessonsOf(starts.value, settledHeld, sources),
  })
}
