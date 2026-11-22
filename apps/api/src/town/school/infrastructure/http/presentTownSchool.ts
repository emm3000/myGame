import type { TownOverview } from '@mygame/contracts'
import type { LessonSlot, ReleasedLesson, ShelvedLesson } from '@mygame/domain'
import { isoOf } from '#platform/infrastructure/http/isoOf'
import type { LessonWordsView } from './gatherLessonWordsView'
import type { LessonView, SchoolView } from './gatherSchoolView'

type SchoolOverview = Pick<
  TownOverview,
  | 'lessons'
  | 'releasedLessons'
  | 'texts'
  | 'hasBandStarted'
  | 'bandLines'
  | 'skills'
  | 'lessonSlot'
  | 'learning'
  | 'chromePhase'
>

type LessonState = TownOverview['lessons'][number]

const presentLessonWords = ({
  isStudied,
  words,
  enteringWordCount,
}: LessonWordsView): Pick<LessonState, 'isStudied' | 'words' | 'enteringWordCount'> => ({
  isStudied,
  words: words.map(({ wordId, standing, reading, support }) => ({
    wordId,
    standing,
    reading: reading === null ? null : { word: reading.word, frame: [...reading.frame] },
    support: support === null ? null : { ...support },
  })),
  enteringWordCount,
})

const presentLesson = ({
  lesson,
  durationSeconds,
  ...words
}: LessonView<ShelvedLesson>): LessonState => ({
  id: lesson.id,
  theme: lesson.theme,
  durationSeconds,
  requiredSchoolLevel: lesson.requiredSchoolLevel,
  skill: { ...lesson.skill },
  ...presentLessonWords(words),
})

const presentReleasedLesson = ({
  lesson,
  durationSeconds,
  ...words
}: LessonView<ReleasedLesson>): TownOverview['releasedLessons'][number] => ({
  id: lesson.id,
  band: lesson.band,
  position: lesson.position,
  durationSeconds,
  requiredSchoolLevel: lesson.requiredSchoolLevel,
  ...presentLessonWords(words),
})

const presentLessonSlot = (slot: LessonSlot): TownOverview['lessonSlot'] =>
  slot.kind === 'idle'
    ? null
    : {
        lessonId: slot.lessonId,
        startedAt: isoOf(slot.startedAt),
        finishesAt: isoOf(slot.finishesAt),
      }

export const presentTownSchool = (school: SchoolView): SchoolOverview => ({
  lessons: school.lessons.map((lesson) => presentLesson(lesson)),
  releasedLessons: school.releasedLessons.map((lesson) => presentReleasedLesson(lesson)),
  texts: school.texts.map(({ id, title }) => ({ id, title })),
  hasBandStarted: school.hasBandStarted,
  bandLines: school.bandLines.map(({ band, count, total }) => ({
    band,
    count,
    total,
  })),
  skills: school.skills.map(({ lessonId, resource, ratePercent, earnedAt }) => ({
    lessonId,
    resource,
    ratePercent,
    earnedAt: isoOf(earnedAt),
  })),
  lessonSlot: presentLessonSlot(school.lessonSlot),
  learning: {
    cap: school.learning.cap,
    inLearning: school.learning.inLearning,
    retainedWords: school.learning.retainedWords,
    nextInLearningDueAt:
      school.learning.nextInLearningDueAt === null
        ? null
        : isoOf(school.learning.nextInLearningDueAt),
  },
  chromePhase: school.chromePhase,
})
