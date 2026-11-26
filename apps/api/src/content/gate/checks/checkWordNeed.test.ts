import { describe, expect, it } from 'vitest'
import { apiPackagePath } from '#apiPackagePath.testSupport'
import { contentOf, entryOf, lessonOneLexicon } from '../contentGate.testSupport'
import { countedWordsOf } from '../countedWordsOf'
import { readGateContent } from '../readGateContent'
import { checkWordNeed } from './checkWordNeed'

const shippedContent = apiPackagePath('content/')

const chromeWords = Array.from({ length: 80 }, (_, index) =>
  entryOf(`chrome-${index + 1}`, `chrome${index + 1}`, `This is chrome${index + 1}.`),
)

const chromeShelf = Array.from(
  { length: 16 },
  (_, index) =>
    [
      `chrome-lesson-${index + 1}`,
      chromeWords.slice(index * 5, index * 5 + 5).map(({ id }) => id),
    ] as const,
)

const newWord = entryOf('word-new', 'new', 'It is new.')

const leaveWord = entryOf('word-leave', 'leave', 'We leave at home.')

const bandLexicon = [...lessonOneLexicon, newWord, leaveWord]

const bandLessonOf = (
  words: ReadonlyArray<ReturnType<typeof entryOf>>,
): readonly [string, ReadonlyArray<string>] => ['lesson-2', words.map(({ id }) => id)]

const ranksHoldingOut = (heldOutCount: number): ReadonlyMap<string, number> =>
  new Map([
    ...contentOf().ranks,
    ...Array.from(
      { length: heldOutCount * 10 },
      (_, index) => [`extra${index + 1}`, 500 + index] as const,
    ),
  ])

describe('content gate check 11, the word need', () => {
  it('passes on the shipped content, every need counting 183 words', () => {
    const shipped = readGateContent(shippedContent)
    expect(shipped.schoolLevels.map((level) => countedWordsOf(shipped, level))).toEqual(
      Array.from({ length: 10 }, () => 183),
    )
    expect(checkWordNeed(shipped)).toEqual([])
  })

  it('fails when level 10 needs more words than no draw can withhold', () => {
    const content = contentOf({
      lexicon: chromeWords,
      lessons: chromeShelf,
      chromeLessonCount: 16,
      wordNeed: { fromLevel: 3, perLevel: 11, retainedFromLevel: 7 },
    })
    expect(checkWordNeed(content)).toEqual([
      'school level 9 counts 80 words, short of the 88 level 10 needs',
      'school level 10 counts 80 words, short of the 88 level 10 needs',
    ])
  })

  it("fails when a building's top level, above the school's, needs more words", () => {
    const content = contentOf({
      lexicon: chromeWords,
      lessons: chromeShelf,
      chromeLessonCount: 16,
      topBuildingLevel: 11,
    })
    expect(checkWordNeed(content)).toEqual([
      'school level 10 counts 80 words, short of the 90 level 11 needs',
    ])
  })

  it('counts a lesson only for the school levels that admit it', () => {
    const content = contentOf({
      lexicon: bandLexicon,
      lessons: [
        ['lesson-1', lessonOneLexicon.map(({ id }) => id)],
        bandLessonOf([newWord, leaveWord]),
      ],
      requiredSchoolLevels: { 'lesson-2': 3 },
    })
    expect([2, 3].map((level) => countedWordsOf(content, level))).toEqual([5, 7])
  })

  it("counts a band's words beyond its draw", () => {
    const content = contentOf({
      lexicon: bandLexicon,
      lessons: [
        ['lesson-1', lessonOneLexicon.map(({ id }) => id)],
        bandLessonOf([newWord, leaveWord]),
      ],
      ranks: ranksHoldingOut(1),
    })
    expect(countedWordsOf(content, 1)).toBe(6)
  })

  it('counts no band word while the draw holds out every shipped one', () => {
    const content = contentOf({
      lexicon: bandLexicon,
      lessons: [['lesson-1', lessonOneLexicon.map(({ id }) => id)], bandLessonOf([newWord])],
      ranks: ranksHoldingOut(2),
    })
    expect(countedWordsOf(content, 1)).toBe(5)
  })
})
