import type { DomainError } from '../DomainError'
import { type ReleaseContent, releasedLessonsOf } from '../holdout/releasedLessonsOf'
import type { BandStart } from '../learning/BandStart'
import type { HeldCard } from '../learning/HeldCard'
import type { SchoolLesson } from '../learning/Lesson'
import type { PlayerId } from '../player/PlayerId'
import type { BandStartRepository } from '../ports/BandStartRepository'
import type { CardRepository } from '../ports/CardRepository'
import type { LessonCatalog } from '../ports/LessonCatalog'
import { ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import type { LessonSlot } from './LessonSlot'
import type { LessonSlotRepository } from './LessonSlotRepository'
import { schoolLessonsOf } from './schoolLessonsOf'
import { type SettledLessonSlot, settledLessonSlot } from './settledLessonSlot'
import type { TownId } from './TownId'

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

export const settledSchoolOf = async (
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
