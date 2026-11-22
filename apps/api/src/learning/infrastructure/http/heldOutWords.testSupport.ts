import type { LessonLibrary, ShelvedLesson } from '@mygame/domain'
import { assert } from 'vitest'
import type { LearningWorld } from './learningRoutes.testSupport'

export type BandLessonFixtures = {
  readonly libraryWithBandLesson: () => LessonLibrary
}

export const bandLessonFixtures = (world: LearningWorld): BandLessonFixtures => {
  const bandLessonHeadwords = ['say', 'time', 'year', 'think', 'come']

  const bandLesson = (): ShelvedLesson => {
    const lessonOne = world.server.lessons.lessonOf('lesson-1')
    assert(lessonOne !== undefined)
    return {
      ...lessonOne,
      id: 'lesson-fixture-holdout',
      theme: 'Saying and thinking',
      words: bandLessonHeadwords.map((headword) => ({
        id: `word-${headword}`,
        acceptedForms: [headword] as const,
        gloss: `gloss of ${headword}`,
        definition: `definition of ${headword}`,
        frames: [{ frame: `They ${headword} it.`, gappedFrame: 'They ____ it.' }],
      })),
    }
  }

  const libraryWithBandLesson = (): LessonLibrary => {
    const lesson = bandLesson()
    const { lessons } = world.server
    return {
      lessonOf: (lessonId) => (lessonId === lesson.id ? lesson : lessons.lessonOf(lessonId)),
      lessonOfWord: (wordId) =>
        lesson.words.some(({ id }) => id === wordId) ? lesson : lessons.lessonOfWord(wordId),
      isHeadword: (word) => lessons.isHeadword(word),
      bandOfLesson: (lessonId) => (lessonId === lesson.id ? 1 : lessons.bandOfLesson(lessonId)),
      wordsOfBand: (band) => lessons.wordsOfBand(band),
      hasLessons: (band) => lessons.hasLessons(band),
      placementWordsOf: (band) => lessons.placementWordsOf(band),
      lessons: () => [...lessons.lessons(), lesson],
      chromeLessons: () => lessons.chromeLessons(),
      frameTokensOf: (wordId, frame) => lessons.frameTokensOf(wordId, frame),
      answerFormsOf: (wordId) => lessons.answerFormsOf(wordId),
      texts: () => lessons.texts(),
      textTokensOf: (textId, passage) => lessons.textTokensOf(textId, passage),
    }
  }

  return { libraryWithBandLesson }
}
