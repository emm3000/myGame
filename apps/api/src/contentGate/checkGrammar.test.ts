import { describe, expect, it } from 'vitest'
import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import { apiPackagePath } from '../apiPackagePath.testSupport'
import { checkGrammar } from './checkGrammar'
import {
  contentOf,
  entryOf,
  laterFrameOf,
  lessonOneFrameWords,
  lessonOneInflections,
  lessonOneLexicon,
  structureOf,
  textOf,
} from './contentGate.testSupport'
import { gateContentOf } from './gateContentOf'

const shippedContent = apiPackagePath('content/')

const lessonOneIds = lessonOneLexicon.map(({ id }) => id)

const afterLessonOne = (
  structures: ReturnType<typeof contentOf>['grammar']['structures'],
  ...laterLessons: ReadonlyArray<LexiconEntry>
) =>
  contentOf({
    structures,
    lexicon: [...lessonOneLexicon, ...laterLessons],
    lessons: [
      ['lesson-1', lessonOneIds],
      ...laterLessons.map(({ id }, index) => [`lesson-${index + 2}`, [id]] as const),
    ],
  })

const lessonOneStructures = [structureOf('lesson-1', lessonOneFrameWords, lessonOneInflections)]

const newHome = entryOf('word-1', 'new', 'This is my new home.', { partOfSpeech: 'adjective' })

const ourAdmittedAtLessonThree = [
  structureOf(
    'lesson-1',
    lessonOneFrameWords,
    lessonOneInflections.filter((inflection) => inflection !== 'our'),
  ),
  structureOf('lesson-3', [], ['our']),
]

const ourHomeFrom = (fromLessonId: string) => {
  const leave = entryOf('word-1', 'leave', 'We leave home.', { partOfSpeech: 'verb' })
  const newAtHome = entryOf('word-2', 'new', 'My home is new.', { partOfSpeech: 'adjective' })
  return contentOf({
    structures: ourAdmittedAtLessonThree,
    lexicon: [
      entryOf('lesson-1-1', 'home', 'This is my home.', {
        laterFrames: [laterFrameOf('home', 'This is our home.', fromLessonId)],
      }),
      ...lessonOneLexicon.slice(1),
      leave,
      newAtHome,
    ],
    lessons: [
      ['lesson-1', lessonOneIds],
      ['lesson-2', [leave.id]],
      ['lesson-3', [newAtHome.id]],
    ],
  })
}

describe('content gate check 6, grammar', () => {
  it('passes the shipped content, lesson 1 included', () => {
    expect(checkGrammar(gateContentOf(shippedContent))).toEqual([])
  })

  it('fails a frame word admitted after the lesson', () => {
    const structures = [
      structureOf(
        'lesson-1',
        lessonOneFrameWords.filter((word) => word !== 'much'),
        lessonOneInflections,
      ),
      structureOf('lesson-2', ['much']),
    ]

    expect(checkGrammar(afterLessonOne(structures, newHome))).toEqual([
      'lesson-1-4: frame holds much, a frame word admitted after lesson-1',
    ])
  })

  it('fails a frame using an inflection its lesson does not admit', () => {
    const structures = [
      structureOf(
        'lesson-1',
        lessonOneFrameWords,
        lessonOneInflections.filter((inflection) => inflection !== 'is'),
      ),
      structureOf('lesson-2', [], ['is']),
    ]

    expect(checkGrammar(afterLessonOne(structures, newHome))).toEqual([
      'lesson-1-1: frame holds is, an inflection admitted after lesson-1',
    ])
  })

  it('fails a frame using an inflection no structure admits', () => {
    const structures = [
      structureOf(
        'lesson-1',
        lessonOneFrameWords,
        lessonOneInflections.filter((inflection) => inflection !== 'my'),
      ),
    ]

    expect(checkGrammar(contentOf({ structures }))).toEqual([
      'lesson-1-1: frame holds my, an inflection no structure admits',
    ])
  })

  it('fails the past of a card verb before its lesson admits -ed', () => {
    const structures = [
      structureOf('lesson-1', lessonOneFrameWords, lessonOneInflections),
      structureOf('lesson-3', [], ['-ed']),
    ]
    const newHomeWorked = entryOf('word-1', 'new', 'They worked at my new home.', {
      partOfSpeech: 'adjective',
    })
    const later = entryOf('word-2', 'leave', 'We leave home.', { partOfSpeech: 'verb' })

    expect(checkGrammar(afterLessonOne(structures, newHomeWorked, later))).toEqual([
      'word-1: frame holds worked, an -ed inflection admitted after lesson-2',
    ])
  })

  it('fails the third person of a card verb no structure admits -s for', () => {
    const newHome = entryOf('word-1', 'new', 'This works for my new home.', {
      partOfSpeech: 'adjective',
    })

    expect(checkGrammar(afterLessonOne(lessonOneStructures, newHome))).toEqual([
      'word-1: frame holds works, an -s inflection no structure admits',
    ])
  })

  it('reads goes and tries as the -s of a card verb, never its -ed', () => {
    const structures = [...lessonOneStructures, structureOf('lesson-1', [], ['-s'])]
    const go = entryOf('word-1', 'go', 'We go home.', { partOfSpeech: 'verb' })
    const tryIt = entryOf('word-2', 'try', 'We try for you.', { partOfSpeech: 'verb' })
    const newHome = entryOf('word-3', 'new', 'This goes for my new home.', {
      partOfSpeech: 'adjective',
    })
    const leave = entryOf('word-4', 'leave', 'This tries us, we leave.', { partOfSpeech: 'verb' })

    expect(checkGrammar(afterLessonOne(structures, go, tryIt, newHome, leave))).toEqual([])
  })

  it('fails the -ing form of a card verb no structure admits -ing for', () => {
    const newHome = entryOf('word-1', 'new', 'We are working at my new home.', {
      partOfSpeech: 'adjective',
    })

    expect(checkGrammar(afterLessonOne(lessonOneStructures, newHome))).toEqual([
      'word-1: frame holds working, an -ing inflection no structure admits',
    ])
  })

  it('fails the comparative of a card adjective no structure admits -er for', () => {
    const leave = entryOf('word-2', 'leave', 'We leave my newer home.', { partOfSpeech: 'verb' })

    expect(checkGrammar(afterLessonOne(lessonOneStructures, newHome, leave))).toEqual([
      'word-2: frame holds newer, an -er inflection no structure admits',
    ])
  })

  it('fails the superlative of a card adjective no structure admits -est for', () => {
    const leave = entryOf('word-2', 'leave', 'We leave my newest home.', { partOfSpeech: 'verb' })

    expect(checkGrammar(afterLessonOne(lessonOneStructures, newHome, leave))).toEqual([
      'word-2: frame holds newest, an -est inflection no structure admits',
    ])
  })

  it("fails a card noun's plural before the lesson that admits noun plurals", () => {
    const structures = [...lessonOneStructures, structureOf('lesson-3', [], ['plural'])]
    const newHomes = entryOf('word-1', 'new', 'We have new homes.', { partOfSpeech: 'adjective' })
    const leave = entryOf('word-2', 'leave', 'We leave home.', { partOfSpeech: 'verb' })

    expect(checkGrammar(afterLessonOne(structures, newHomes, leave))).toEqual([
      'word-1: frame holds homes, a plural inflection admitted after lesson-2',
    ])
  })

  it("passes a card noun's plural from the lesson that admits noun plurals", () => {
    const structures = [...lessonOneStructures, structureOf('lesson-2', [], ['plural'])]
    const newHomes = entryOf('word-1', 'new', 'We have new homes.', { partOfSpeech: 'adjective' })

    expect(checkGrammar(afterLessonOne(structures, newHomes))).toEqual([])
  })

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

  it('reads a homograph form by the word its entry names', () => {
    const leave = entryOf('word-1', 'leave', 'We leave home.', { partOfSpeech: 'verb' })
    const newAfterLeaving = entryOf('word-2', 'new', 'We left my new home.', {
      partOfSpeech: 'adjective',
      homographs: { left: 'leave' },
    })

    expect(checkGrammar(afterLessonOne(lessonOneStructures, leave, newAfterLeaving))).toEqual([
      'word-2: frame holds left, an irregular past inflection no structure admits',
    ])
  })

  it('fails a structure admitted by a lesson the curriculum does not list', () => {
    const structures = [...lessonOneStructures, structureOf('lesson-9', [], ['-ed'])]

    expect(checkGrammar(contentOf({ structures }))).toEqual([
      'structure "Grammar of lesson-9" is admitted by lesson-9, which the curriculum does not list',
    ])
  })

  it('fails a structure listed after one a later lesson admits', () => {
    const structures = [structureOf('lesson-2', [], ['-ed']), ...lessonOneStructures]

    expect(checkGrammar(afterLessonOne(structures, newHome))).toEqual([
      'structure "Grammar of lesson-1" is admitted by lesson-1, before a structure listed above it',
    ])
  })

  it('fails an inflection listed by two structures', () => {
    const structures = [...lessonOneStructures, structureOf('lesson-1', [], ['my'])]

    expect(checkGrammar(contentOf({ structures }))).toEqual([
      'inflection my is listed more than once',
    ])
  })

  it('fails an inflection that is neither a form of a frame word nor a card-word ending', () => {
    const structures = [...lessonOneStructures, structureOf('lesson-1', [], ['-ly', 'homes', 'be'])]

    expect(checkGrammar(contentOf({ structures }))).toEqual([
      'structure "Grammar of lesson-1" lists -ly, which is neither a form of a frame word, a contraction piece nor -s, -ed, -ing, -er, -est, plural, irregular past or past participle',
      'structure "Grammar of lesson-1" lists homes, which is neither a form of a frame word, a contraction piece nor -s, -ed, -ing, -er, -est, plural, irregular past or past participle',
      'structure "Grammar of lesson-1" lists be, which is neither a form of a frame word, a contraction piece nor -s, -ed, -ing, -er, -est, plural, irregular past or past participle',
    ])
  })

  it('passes a structure listing the object relative that', () => {
    const structures = [
      ...lessonOneStructures,
      structureOf('lesson-1', ['that'], ['object relative that']),
    ]

    expect(checkGrammar(contentOf({ structures }))).toEqual([])
  })

  it('passes a later frame using an inflection the lesson it is written for admits', () => {
    expect(checkGrammar(ourHomeFrom('lesson-3'))).toEqual([])
  })

  it('fails a later frame using an inflection admitted after the lesson it is written for', () => {
    expect(checkGrammar(ourHomeFrom('lesson-2'))).toEqual([
      'lesson-1-1, later frame for lesson-2: frame holds our, an inflection admitted after lesson-2',
    ])
  })

  it('fails a text using a frame word admitted after its lesson', () => {
    const structures = [
      structureOf(
        'lesson-1',
        lessonOneFrameWords.filter((word) => word !== 'the'),
        lessonOneInflections,
      ),
      structureOf('lesson-3', ['the']),
    ]
    const content = {
      ...ourHomeFrom('lesson-3'),
      texts: [textOf('lesson-2', ['We have the food.'])],
    }

    expect(checkGrammar({ ...content, grammar: contentOf({ structures }).grammar })).toEqual([
      'text-1: text holds the, a frame word admitted after lesson-2',
    ])
  })

  it('fails a text using an inflection admitted after its lesson', () => {
    const text = textOf('lesson-2', ['This is our home.'])

    expect(checkGrammar({ ...ourHomeFrom('lesson-3'), texts: [text] })).toEqual([
      'text-1: text holds our, an inflection admitted after lesson-2',
    ])
  })

  it('passes a text using an inflection its lesson admits', () => {
    const text = textOf('lesson-3', ['This is our home.'])

    expect(checkGrammar({ ...ourHomeFrom('lesson-3'), texts: [text] })).toEqual([])
  })

  describe('contraction pieces, cannot, whom and whose', () => {
    const later = entryOf('word-2', 'leave', 'We leave home.', { partOfSpeech: 'verb' })
    const pieceFrom = (lessonId: string, piece: string) => [
      ...lessonOneStructures,
      structureOf('lesson-1', ['can', 'who', 'it', 'will']),
      structureOf(lessonId, [], [piece]),
    ]
    const newHomeHolding = (frame: string) =>
      entryOf('word-1', 'new', frame, { partOfSpeech: 'adjective' })

    it.each([
      ["'m", "I'm at my new home.", "'m, an inflection"],
      ["'re", "We're at my new home.", "'re, an inflection"],
      ["'s", "It's my new home.", "'s, an inflection"],
      ["n't", "We don't work at my new home.", "n't, an inflection"],
      ["'ll", "We'll work at my new home.", "'ll, an inflection"],
      ["possessive 's", "The school's food is new.", "'s, a possessive 's inflection"],
      ['cannot', 'We cannot work at my new home.', 'cannot, an inflection'],
    ])('fails %s one lesson before the structure that admits it', (piece, frame, holding) => {
      expect(
        checkGrammar(afterLessonOne(pieceFrom('lesson-3', piece), newHomeHolding(frame), later)),
      ).toEqual([`word-1: frame holds ${holding} admitted after lesson-2`])
    })

    it.each([
      ["'m", "I'm at my new home."],
      ["'re", "We're at my new home."],
      ["'s", "It's my new home."],
      ["'ll", "We'll work at my new home."],
      ["n't", "We don't work at my new home."],
      ["possessive 's", "The school's food is new."],
      ['cannot', 'We cannot work at my new home.'],
    ])('passes %s from the lesson of the structure that admits it', (piece, frame) => {
      expect(
        checkGrammar(afterLessonOne(pieceFrom('lesson-2', piece), newHomeHolding(frame))),
      ).toEqual([])
    })

    it.each([
      ["can't", 'can'],
      ["won't", 'will'],
    ])("reads %s as %s and n't", (contraction, stem) => {
      const structures = [
        ...lessonOneStructures,
        structureOf(
          'lesson-1',
          ['can', 'will'].filter((word) => word !== stem),
          ["n't"],
        ),
        structureOf('lesson-3', [stem]),
      ]
      const holding = newHomeHolding(`We ${contraction} work at my new home.`)

      expect(checkGrammar(afterLessonOne(structures, holding, later))).toEqual([
        `word-1: frame holds ${stem}, a frame word admitted after lesson-2`,
      ])
    })

    it('reads a curly apostrophe as a straight one', () => {
      const curly = newHomeHolding('I\u2019m at my new home.')

      expect(checkGrammar(afterLessonOne(pieceFrom('lesson-3', "'m"), curly, later))).toEqual([
        "word-1: frame holds 'm, an inflection admitted after lesson-2",
      ])
    })

    it("reads 's after a card adverb as the piece of be", () => {
      const there = entryOf('word-1', 'there', 'We work there.', { partOfSpeech: 'adverb' })
      const theresFood = entryOf('word-2', 'new', "There's food at my new home.", {
        partOfSpeech: 'adjective',
      })
      const leave = entryOf('word-3', 'leave', 'We leave home.', { partOfSpeech: 'verb' })

      expect(
        checkGrammar(afterLessonOne(pieceFrom('lesson-4', "'s"), there, theresFood, leave)),
      ).toEqual(["word-2: frame holds 's, an inflection admitted after lesson-3"])
    })

    it.each([
      ['whom', 'We work for whom?'],
      ['whose', 'Whose home is new?'],
    ])('fails %s, which no structure admits', (word, frame) => {
      expect(
        checkGrammar(afterLessonOne(pieceFrom('lesson-1', 'cannot'), newHomeHolding(frame))),
      ).toEqual([`word-1: frame holds ${word}, an inflection no structure admits`])
    })

    it('fails a definition holding a piece admitted after the lesson that teaches its word', () => {
      const defined = entryOf('word-1', 'new', 'My home is new.', {
        partOfSpeech: 'adjective',
        definition: "you'll have this at home",
      })

      expect(checkGrammar(afterLessonOne(pieceFrom('lesson-3', "'ll"), defined, later))).toEqual([
        "word-1: definition holds 'll, an inflection admitted after lesson-2",
      ])
    })

    it('fails a lesson theme holding a piece admitted after the lesson', () => {
      const content = afterLessonOne(
        pieceFrom('lesson-3', "'ll"),
        newHomeHolding('My home is new.'),
        later,
      )
      const lessons = content.lessons.map((lesson) =>
        lesson.content.id === 'lesson-2'
          ? { ...lesson, content: { ...lesson.content, theme: "We'll work" } }
          : lesson,
      )

      expect(checkGrammar({ ...content, lessons })).toEqual([
        "lesson-2: theme holds 'll, an inflection admitted after lesson-2",
      ])
    })
  })

  describe('the relative that', () => {
    const later = entryOf('word-2', 'leave', 'We leave home.', { partOfSpeech: 'verb' })
    const objectRelativeFrom = (lessonId: string) => [
      ...lessonOneStructures,
      structureOf('lesson-1', ['that', 'so', 'after'], ['-s']),
      structureOf(lessonId, [], ['object relative that']),
    ]
    const definedAs = (definition: string) =>
      entryOf('word-1', 'new', 'My home is new.', { partOfSpeech: 'adjective', definition })

    it('fails an object relative that before the lesson that admits it', () => {
      const defined = definedAs('something that you need')

      expect(checkGrammar(afterLessonOne(objectRelativeFrom('lesson-3'), defined, later))).toEqual([
        'word-1: definition holds that, an object relative that inflection admitted after lesson-2',
      ])
    })

    it('passes an object relative that from the lesson that admits it', () => {
      const defined = definedAs('something that you need')

      expect(checkGrammar(afterLessonOne(objectRelativeFrom('lesson-2'), defined))).toEqual([])
    })

    it.each([
      ['the demonstrative that', 'That man is the mayor.'],
      ['the subject relative that', 'a person that works for someone else'],
    ])('passes %s before the lesson that admits the object relative', (_, definition) => {
      const defined = definedAs(definition)

      expect(checkGrammar(afterLessonOne(objectRelativeFrom('lesson-3'), defined, later))).toEqual(
        [],
      )
    })

    it.each([
      ['so', 'so that she can help'],
      ['after', 'after that you go'],
    ])('reads that after the frame word %s as no object relative', (_, definition) => {
      const defined = definedAs(definition)

      expect(checkGrammar(afterLessonOne(objectRelativeFrom('lesson-3'), defined, later))).toEqual(
        [],
      )
    })
  })
})
