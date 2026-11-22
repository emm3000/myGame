import { describe, expect, it } from 'vitest'
import {
  afterLessonOne,
  entryOf,
  lessonOneStructures,
  structureOf,
} from '../contentGate.testSupport'
import { checkGrammar } from './checkGrammar'

describe('content gate check 6, grammar, the forms of a card verb', () => {
  describe('past forms', () => {
    const go = entryOf('word-1', 'go', 'We go home.', { partOfSpeech: 'verb' })
    const make = entryOf('word-2', 'make', 'We make food.', { partOfSpeech: 'verb' })
    const leave = entryOf('word-4', 'leave', 'We leave home.', { partOfSpeech: 'verb' })
    const pastFrom = (lessonId: string, ...inflections: ReadonlyArray<string>) => [
      ...lessonOneStructures,
      structureOf(lessonId, [], inflections),
    ]
    const newHomeHolding = (frame: string) =>
      entryOf('word-3', 'new', frame, { partOfSpeech: 'adjective' })

    it('fails went and made before the lesson that admits irregular pasts', () => {
      const wentAndMade = newHomeHolding('We went home, we made my new home.')

      expect(
        checkGrammar(
          afterLessonOne(pastFrom('lesson-5', 'irregular past'), go, make, wentAndMade, leave),
        ),
      ).toEqual([
        'word-3: frame holds went, an irregular past inflection admitted after lesson-4',
        'word-3: frame holds made, an irregular past inflection admitted after lesson-4',
      ])
    })

    it('passes went and made from the lesson that admits irregular pasts', () => {
      const wentAndMade = newHomeHolding('We went home, we made my new home.')

      expect(
        checkGrammar(afterLessonOne(pastFrom('lesson-4', 'irregular past'), go, make, wentAndMade)),
      ).toEqual([])
    })

    it('fails has made before the lesson that admits the present perfect', () => {
      const structures = [
        ...pastFrom('lesson-1', 'irregular past', 'has'),
        structureOf('lesson-5', [], ['past participle']),
      ]
      const hasMade = newHomeHolding('This has made my new home.')

      expect(checkGrammar(afterLessonOne(structures, go, make, hasMade, leave))).toEqual([
        'word-3: frame holds made, a past participle inflection admitted after lesson-4',
      ])
    })

    it("reads a past form after hasn't as a past participle", () => {
      const hasntMade = newHomeHolding("This hasn't made my new home.")

      expect(
        checkGrammar(
          afterLessonOne(pastFrom('lesson-1', 'irregular past', 'has', "n't"), go, make, hasntMade),
        ),
      ).toEqual(['word-3: frame holds made, a past participle inflection no structure admits'])
    })

    it('reads a past form after has and a noun subject as a past participle', () => {
      const hasTheSchoolMade = newHomeHolding('Has the school made it?')

      expect(
        checkGrammar(afterLessonOne(pastFrom('lesson-1', 'has'), go, make, hasTheSchoolMade)),
      ).toEqual(['word-3: frame holds made, a past participle inflection no structure admits'])
    })

    it('reads a past form after have and an adverb as a past participle', () => {
      const haveNeverGone = newHomeHolding('We have never gone to my new home.')

      expect(
        checkGrammar(
          afterLessonOne(pastFrom('lesson-1', 'irregular past'), go, make, haveNeverGone),
        ),
      ).toEqual(['word-3: frame holds gone, a past participle inflection no structure admits'])
    })

    it('fails a past form the irregular verb list does not name', () => {
      const wentAndMade = newHomeHolding('We went home, we made my new home.')
      const content = afterLessonOne(pastFrom('lesson-1', 'irregular past'), go, make, wentAndMade)

      expect(
        checkGrammar({ ...content, grammar: { ...content.grammar, irregularVerbs: [] } }),
      ).toEqual([
        'word-3: frame holds went, a form of go the irregular verb list does not name',
        'word-3: frame holds made, a form of make the irregular verb list does not name',
      ])
    })
  })

  describe('the present perfect', () => {
    const see = entryOf('word-2', 'see', 'We see you.', { partOfSpeech: 'verb' })
    const come = entryOf('word-3', 'come', 'We come home.', { partOfSpeech: 'verb' })
    const make = entryOf('word-4', 'make', 'We make food.', { partOfSpeech: 'verb' })
    const perfectAfterThePast = [
      ...lessonOneStructures,
      structureOf('lesson-1', ['he', 'she', 'it'], ['irregular past', 'was', 'has', "'s", "n't"]),
      structureOf('lesson-3', [], ['past participle']),
    ]
    const holdingAt = (lessonId: string, frame: string) => {
      const holding = entryOf('word-1', 'new', frame, { partOfSpeech: 'adjective' })
      return lessonId === 'lesson-2'
        ? afterLessonOne(perfectAfterThePast, holding, see, come, make)
        : afterLessonOne(perfectAfterThePast, see, holding, come, make)
    }

    it.each([
      ['seen', 'My new home was seen.'],
      ['come', 'We have come to my new home.'],
    ])('fails %s as a past participle before the lesson that admits it', (form, frame) => {
      expect(checkGrammar(holdingAt('lesson-2', frame))).toEqual([
        `word-1: frame holds ${form}, a past participle inflection admitted after lesson-2`,
      ])
    })

    it('passes saw as the irregular past it is', () => {
      expect(checkGrammar(holdingAt('lesson-2', 'We saw my new home.'))).toEqual([])
    })

    it.each([
      ['seen', 'Have you seen my new home?'],
      ['made', 'Have you made my new home?'],
    ])('reads %s after have and a question subject as a past participle', (form, frame) => {
      expect(checkGrammar(holdingAt('lesson-2', frame))).toEqual([
        `word-1: frame holds ${form}, a past participle inflection admitted after lesson-2`,
      ])
    })

    it("passes hasn't and a past participle from the lesson that admits it", () => {
      expect(checkGrammar(holdingAt('lesson-3', "She hasn't made my new home."))).toEqual([])
    })

    it.each([
      ['seen', "He's seen my new home."],
      ['made', "He's made my new home."],
    ])("reads 's before %s as has", (form, frame) => {
      expect(checkGrammar(holdingAt('lesson-2', frame))).toEqual([
        `word-1: frame holds ${form}, a past participle inflection admitted after lesson-2`,
      ])
    })

    it.each(["He's here.", "He's at my new home."])(
      "keeps reading 's before a word that is no past form as be: %s",
      (frame) => {
        expect(checkGrammar(holdingAt('lesson-2', frame))).toEqual([])
      },
    )

    it('stops the have lookback at a sentence end', () => {
      expect(
        ['Do you see what we have? I made my new home.', 'Have you made my new home?'].map(
          (frame) => checkGrammar(holdingAt('lesson-2', frame)),
        ),
      ).toEqual([
        [],
        ['word-1: frame holds made, a past participle inflection admitted after lesson-2'],
      ])
    })
  })

  describe("'s before a regular -ed form", () => {
    const close = entryOf('word-2', 'close', 'We close the school.', { partOfSpeech: 'verb' })
    const make = entryOf('word-3', 'make', 'We make food.', { partOfSpeech: 'verb' })
    const edBeforeThePerfect = [
      ...lessonOneStructures,
      structureOf('lesson-1', ['he', 'it'], ['irregular past', "'s"]),
      structureOf('lesson-3', [], ['-ed']),
      structureOf('lesson-4', [], ['past participle']),
    ]
    const holdingAt = (lessonId: string, frame: string) => {
      const holding = entryOf('word-1', 'new', frame, { partOfSpeech: 'adjective' })
      return lessonId === 'lesson-2'
        ? afterLessonOne(edBeforeThePerfect, holding, close, make)
        : afterLessonOne(edBeforeThePerfect, close, holding, make)
    }

    it("reads 's after a noun host and before a regular -ed form as is", () => {
      expect(checkGrammar(holdingAt('lesson-3', "The school's closed."))).toEqual([])
    })

    it("keeps reading 's after a noun host and before a noun as possessive", () => {
      const book = entryOf('word-4', 'book', 'We have a book.')
      const content = afterLessonOne(
        [structureOf('lesson-1', [], ['plural']), ...edBeforeThePerfect],
        close,
        entryOf('word-1', 'new', "The school's books are here.", { partOfSpeech: 'adjective' }),
        make,
        book,
      )
      const booksListed = {
        ...content,
        forms: new Map([
          ...content.forms,
          ['book', new Set(['book'])],
          ['books', new Set(['book'])],
        ]),
      }

      expect(checkGrammar(booksListed)).toEqual([
        "word-1: frame holds 's, a possessive 's inflection no structure admits",
      ])
    })

    it("reads 's before a regular -ed form as is", () => {
      expect(
        [
          holdingAt('lesson-2', "It's closed."),
          holdingAt('lesson-3', "It's closed."),
          holdingAt('lesson-3', "He's made my new home."),
        ].map((content) => checkGrammar(content)),
      ).toEqual([
        ['word-1: frame holds closed, an -ed inflection admitted after lesson-2'],
        [],
        ['word-1: frame holds made, a past participle inflection admitted after lesson-3'],
      ])
    })
  })
})
