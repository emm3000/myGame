import type { DueReview } from '@mygame/contracts'
import { assert } from 'vitest'
import type { LessonLibrary, ShelvedLesson } from '#content/application/ports/LessonLibrary'
import type { LearningWorld, Player } from './learningRoutes.testSupport'

export type LaterFrameFixtures = {
  readonly libraryWithALaterFrame: () => LessonLibrary
  readonly recallOfSchool: (player: Player) => Promise<DueReview>
}

export const laterFrameFixtures = (world: LearningWorld): LaterFrameFixtures => {
  const { dueReviewOf } = world

  const laterFrameOfSchool = {
    frame: 'My school is new.',
    gappedFrame: 'My ____ is new.',
    fromLessonId: 'lesson-fixture-later',
  }

  const libraryWithALaterFrame = (): LessonLibrary => {
    const { lessons } = world.server
    const lessonOne = lessons.lessons().find(({ id }) => id === 'lesson-1')
    assert(lessonOne !== undefined)
    const variedLessonOne: ShelvedLesson = {
      ...lessonOne,
      words: lessonOne.words.map((word) =>
        word.id === 'lesson-1-2' ? { ...word, frames: [word.frames[0], laterFrameOfSchool] } : word,
      ),
    }
    const bandLesson: ShelvedLesson = {
      ...lessonOne,
      id: 'lesson-fixture-later',
      theme: 'Saying and thinking',
      words: [
        {
          id: 'word-say',
          acceptedForms: ['say'],
          gloss: 'decir',
          definition: 'to tell something with words',
          frames: [{ frame: 'They say it.', gappedFrame: 'They ____ it.' }],
        },
      ],
    }
    const shelved = [variedLessonOne, bandLesson]
    return {
      lessonOf: (lessonId) => shelved.find(({ id }) => id === lessonId),
      lessonOfWord: (wordId) => shelved.find(({ words }) => words.some(({ id }) => id === wordId)),
      isHeadword: (word) => lessons.isHeadword(word),
      bandOfLesson: (lessonId) => (lessonId === bandLesson.id ? 1 : undefined),
      wordsOfBand: (band) => lessons.wordsOfBand(band),
      hasLessons: (band) => lessons.hasLessons(band),
      placementWordsOf: (band) => lessons.placementWordsOf(band),
      lessons: () => shelved,
      chromeLessons: () => lessons.chromeLessons(),
      frameTokensOf: (wordId, frame) => lessons.frameTokensOf(wordId, frame),
      answerFormsOf: (wordId) => lessons.answerFormsOf(wordId),
      texts: () => lessons.texts(),
      textTokensOf: (textId, passage) => lessons.textTokensOf(textId, passage),
    }
  }

  const recallOfSchool = async (player: Player): Promise<DueReview> => {
    const recall = await dueReviewOf(player, 'lesson-1-2')
    assert(recall.mode === 'recall')
    return recall
  }

  return { libraryWithALaterFrame, recallOfSchool }
}
