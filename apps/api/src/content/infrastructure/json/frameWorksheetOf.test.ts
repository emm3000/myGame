import { describe, expect, it } from 'vitest'
import { frameWorksheetOf } from './frameWorksheetOf'
import type { LessonOfFiles, LexiconEntry } from './readLessonContentFiles'

const home: LexiconEntry = {
  id: 'lesson-1-1',
  lemma: 'home',
  partOfSpeech: 'noun',
  frames: [{ frame: 'This is my home.', gappedFrame: 'This is my ____.' }],
  gloss: { es: 'hogar' },
  definition: 'the place where you live',
}

const school: LexiconEntry = {
  id: 'lesson-1-2',
  lemma: 'school',
  partOfSpeech: 'noun',
  frames: [{ frame: 'We are at school.', gappedFrame: 'We are at ____.' }],
  gloss: { es: 'escuela' },
}

const office: LexiconEntry = {
  id: 'lesson-1-3',
  lemma: 'office',
  partOfSpeech: 'noun',
  frames: [{ frame: 'She is at the office.', gappedFrame: 'She is at the ____.' }],
  gloss: { es: 'oficina' },
}

const lessonOf = (words: ReadonlyArray<LexiconEntry>): LessonOfFiles => ({
  content: {
    id: 'lesson-1',
    theme: 'A day in town',
    durationSeconds: 300,
    requiredSchoolLevel: 1,
    wordIds: words.map(({ id }) => id),
  },
  words,
})

const homeWithLaterFrame: LexiconEntry = {
  ...home,
  frames: [
    ...home.frames,
    {
      frame: 'When do you go home?',
      gappedFrame: 'When do you go ____?',
      fromLessonId: 'lesson-7',
    },
  ],
}

describe('frameWorksheetOf', () => {
  it("prints a new frame beside its word's gloss, definition and anchor, its gap filled with each other word of the word's lesson", () => {
    const lexicon = [homeWithLaterFrame, school, office]

    const worksheet = frameWorksheetOf({ lexicon, lessons: [lessonOf(lexicon)] }, [
      home,
      school,
      office,
    ])

    expect(worksheet.split('\n')).toContain(
      '| home | When do you go home? | hogar | the place where you live | This is my home. | When do you go school?<br>When do you go office? |  |',
    )
  })

  it('prints no row for a frame the base lexicon already holds', () => {
    const lexicon = [homeWithLaterFrame, school, office]

    const worksheet = frameWorksheetOf({ lexicon, lessons: [lessonOf(lexicon)] }, lexicon)

    expect(worksheet.split('\n').slice(2)).toEqual([])
  })

  it("fills a gap of several blanks with the other word's words in order", () => {
    const comeBack: LexiconEntry = {
      id: 'lesson-30-1',
      lemma: 'come back',
      partOfSpeech: 'verb',
      frames: [{ frame: 'Please come back soon.', gappedFrame: 'Please ____ ____ soon.' }],
      gloss: { es: 'volver' },
    }
    const goOut: LexiconEntry = {
      id: 'lesson-30-2',
      lemma: 'go out',
      partOfSpeech: 'verb',
      frames: [{ frame: 'We go out at night.', gappedFrame: 'We ____ ____ at night.' }],
      gloss: { es: 'salir' },
    }
    const lexicon = [comeBack, goOut]

    const worksheet = frameWorksheetOf({ lexicon, lessons: [lessonOf(lexicon)] }, [goOut])

    expect(worksheet.split('\n')).toContain(
      '| come back | Please come back soon. | volver |  | Please come back soon. | Please go out soon. |  |',
    )
  })
})
