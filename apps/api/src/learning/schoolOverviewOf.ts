import type { TownOverview } from '@mygame/contracts/town'
import { type DomainError, type HeldCard, isWordRetained, ok, type Result } from '@mygame/domain'
import {
  deriveLessonDurationSeconds,
  type LessonSlot,
  schoolLevelOf,
  studyPercentAt,
  type TownCatalog,
} from '@mygame/domain/town'
import { isoOf } from '../http/isoOf'
import type { TownReading } from '../town/TownReading'
import type { LessonLibrary, ShelvedLesson } from './LessonLibrary'

type SchoolOverview = Pick<TownOverview, 'lessons' | 'skills' | 'lessonSlot'>

type LessonState = TownOverview['lessons'][number]

const lessonStateOf = (
  lesson: ShelvedLesson,
  cards: ReadonlyArray<HeldCard>,
  durationSeconds: number,
): LessonState => {
  const words = lesson.words.map(({ id }) => ({
    wordId: id,
    held: cards.find(({ wordId }) => wordId === id),
  }))
  return {
    id: lesson.id,
    theme: lesson.theme,
    durationSeconds,
    requiredSchoolLevel: lesson.requiredSchoolLevel,
    skill: { ...lesson.skill },
    isStudied: words.some(({ held }) => held !== undefined),
    words: words.map(({ wordId, held }) => ({
      wordId,
      isRetained: held !== undefined && isWordRetained(held),
    })),
  }
}

const lessonSlotOf = (slot: LessonSlot): TownOverview['lessonSlot'] =>
  slot.kind === 'idle'
    ? null
    : {
        lessonId: slot.lessonId,
        startedAt: isoOf(slot.startedAt),
        finishesAt: isoOf(slot.finishesAt),
      }

export const schoolOverviewOf = (
  { town, at, lessonSlot, cards }: TownReading,
  catalog: TownCatalog,
  lessons: LessonLibrary,
): Result<SchoolOverview, DomainError> => {
  const school = schoolLevelOf(town.buildingLevels.school, catalog)
  if (!school.ok) {
    return school
  }
  const studyPercent = studyPercentAt(at, catalog.townSettings())
  return ok({
    lessons: lessons
      .lessons()
      .map((lesson) =>
        lessonStateOf(
          lesson,
          cards,
          deriveLessonDurationSeconds(
            lesson.durationSeconds,
            school.value.lessonPercent,
            studyPercent,
          ),
        ),
      ),
    skills: town.skills.map(({ lessonId, resource, ratePercent, earnedAt }) => ({
      lessonId,
      resource,
      ratePercent,
      earnedAt: isoOf(earnedAt),
    })),
    lessonSlot: lessonSlotOf(lessonSlot),
  })
}
