import type { TownOverview } from '@mygame/contracts/town'
import {
  cardsInLearningOf,
  type DomainError,
  type Headword,
  type HeldCard,
  ok,
  type Result,
  readableWordsOf,
  retainedWordsOf,
  wordStandingOf,
} from '@mygame/domain'
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

type SchoolOverview = Pick<TownOverview, 'lessons' | 'skills' | 'lessonSlot' | 'learning'>

type LessonState = TownOverview['lessons'][number]

type LearnerState = {
  readonly cards: ReadonlyArray<HeldCard>
  readonly heldOutWords: ReadonlyArray<Headword>
  readonly lessonSlot: LessonSlot
}

const lessonStateOf = (
  lesson: ShelvedLesson,
  { cards, heldOutWords, lessonSlot }: LearnerState,
  durationSeconds: number,
): LessonState => {
  const isRunning = lessonSlot.kind === 'busy' && lessonSlot.lessonId === lesson.id
  const readable = readableWordsOf(lesson, heldOutWords, cards, isRunning)
  const words = lesson.words.map((word) => ({
    word,
    held: cards.find(({ wordId }) => wordId === word.id),
  }))
  return {
    id: lesson.id,
    theme: lesson.theme,
    durationSeconds,
    requiredSchoolLevel: lesson.requiredSchoolLevel,
    skill: { ...lesson.skill },
    isStudied: words.some(({ held }) => held !== undefined),
    words: words.map(({ word, held }) => ({
      wordId: word.id,
      standing: wordStandingOf(held),
      reading: readable.includes(word)
        ? { word: word.acceptedForms[0], gloss: word.gloss, frame: word.frame }
        : null,
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
  { town, at, lessonSlot, cards, heldOutWords }: TownReading,
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
          { cards, heldOutWords, lessonSlot },
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
    learning: {
      cap: school.value.learningCap,
      inLearning: cardsInLearningOf(cards),
      retainedWords: retainedWordsOf(lessons.lessons(), town.skills, cards),
    },
  })
}
