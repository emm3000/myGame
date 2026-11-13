import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  type FrameReader,
  type FrameSpans,
  Instant,
  type Lesson,
  type LessonWord,
  MemoryCard,
  readingFrameOf,
  reviewPromptOf,
  type Scaffold,
  type StoredMemoryCard,
} from '@mygame/domain'
import { afterEach, assert, describe, expect, it } from 'vitest'
import { JsonLessonCatalog } from './JsonLessonCatalog'

const shippedContent = fileURLToPath(new URL('../../../content/', import.meta.url))

const shipped = JsonLessonCatalog.fromDirectory(shippedContent)

const copies: Array<string> = []

afterEach(() => {
  for (const directory of copies.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

const catalogWithEntry = (
  wordId: string,
  change: Readonly<Record<string, unknown>>,
): JsonLessonCatalog => {
  const directory = mkdtempSync(join(tmpdir(), 'mygame-frames-'))
  copies.push(directory)
  cpSync(shippedContent, directory, { recursive: true })
  const wordsFile = join(directory, 'lessons', 'words.json')
  const lexicon: ReadonlyArray<{ readonly id: string }> = JSON.parse(
    readFileSync(wordsFile, 'utf8'),
  )
  writeFileSync(
    wordsFile,
    JSON.stringify(lexicon.map((entry) => (entry.id === wordId ? { ...entry, ...change } : entry))),
  )
  return JsonLessonCatalog.fromDirectory(directory)
}

const enteredAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T09:00:00Z'))

const cardInReview = (): MemoryCard => {
  const stored = {
    state: 'review',
    step: null,
    stability: 3.1,
    difficulty: 2.0975,
    lastReviewAt: Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:10:00Z')),
    lastRating: 'good',
    enteredAt,
    retainedAt: null,
  } as StoredMemoryCard
  const card = MemoryCard.restore(stored)
  assert(card.ok)
  return card.value
}

const readerOf = (scaffold: Scaffold, lessons: JsonLessonCatalog = shipped): FrameReader => ({
  cards: [],
  placedOutBands: [],
  scaffold,
  lessons,
})

const taughtOf = (
  wordId: string,
  lessons: JsonLessonCatalog = shipped,
): { readonly lesson: Lesson; readonly word: LessonWord } => {
  const lesson = lessons.lessonOfWord(wordId)
  const word = lesson?.words.find(({ id }) => id === wordId)
  assert(lesson !== undefined && word !== undefined)
  return { lesson, word }
}

const supportOf = (spans: FrameSpans, text: string): unknown => {
  const span = spans.find((candidate) => candidate.text === text)
  assert(span !== undefined, `no span ${text}`)
  return span.support
}

const readingOf = (wordId: string, lessons: JsonLessonCatalog = shipped): FrameSpans =>
  readingFrameOf(taughtOf(wordId, lessons).word, readerOf('es', lessons))

const recallOf = (
  wordId: string,
  gappedFrame: string,
  lessons: JsonLessonCatalog = shipped,
): FrameSpans => {
  const prompt = reviewPromptOf(
    { ...taughtOf(wordId, lessons), card: cardInReview(), shownFrame: gappedFrame },
    readerOf('none', lessons),
  )
  assert(prompt.mode === 'recall')
  return prompt.gappedFrame
}

const recognitionOf = (wordId: string): FrameSpans => {
  const taught = taughtOf(wordId)
  const prompt = reviewPromptOf(
    {
      ...taught,
      card: MemoryCard.entered(enteredAt),
      shownFrame: taught.word.frames[0].frame,
    },
    readerOf('es'),
  )
  assert(prompt.mode === 'recognition')
  return prompt.frame
}

const supportedTexts = (spans: FrameSpans): ReadonlyArray<string> =>
  spans.filter(({ support }) => support !== null).map(({ text }) => text)

describe('the frames the content resolves', () => {
  it('resolves every shipped frame and gapped frame into tokens that join into it', () => {
    const unjoined = shipped
      .lessons()
      .flatMap(({ words }) =>
        words.flatMap(({ id, frames }) =>
          frames.flatMap(({ frame, gappedFrame }) => [
            { id, text: frame },
            { id, text: gappedFrame },
          ]),
        ),
      )
      .filter(
        ({ id, text }) =>
          shipped
            .frameTokensOf(id, text)
            ?.map((token) => token.text)
            .join('') !== text,
      )

    expect(unjoined).toEqual([])
  })

  it('resolves a token to the card word its form names', () => {
    expect(supportOf(readingOf('word-38'), 'town')).toEqual({
      shown: 'beside',
      text: 'pueblo',
      language: 'es',
    })
  })

  it('resolves an inflected token to its card word', () => {
    expect(supportOf(readingOf('word-40'), 'works')).toEqual({
      shown: 'beside',
      text: 'trabajar',
      language: 'es',
    })
  })

  it('answers no tokens for a frame the word does not hold', () => {
    expect(shipped.frameTokensOf('word-38', 'Our town is by a river.')).toBeUndefined()
  })

  it('never supports a frame word', () => {
    expect(supportedTexts(readingOf('word-31'))).toEqual(['works', 'city'])
  })

  it('never supports a knows that means conocer', () => {
    expect(supportedTexts(recallOf('word-66', 'She knows the ____ well.'))).toEqual(['well'])
  })

  it('never supports a form two card words share', () => {
    const lessons = catalogWithEntry('word-28', { lemma: 'town' })

    expect(supportedTexts(readingOf('word-38', lessons))).toEqual([])
  })

  it('never supports like in Things like this', () => {
    expect(supportedTexts(readingOf('word-126'))).toEqual(['Things', 'towns'])
  })

  it('never supports right in right now', () => {
    expect(supportedTexts(recallOf('word-15', 'I am at the office right ____.'))).toEqual([
      'office',
    ])
  })

  it('never supports find on the find out reading', () => {
    expect(supportedTexts(readingOf('word-128'))).toEqual(['office', 'closes'])
  })

  it('never supports go on the go on recognition', () => {
    expect(supportedTexts(recognitionOf('word-126'))).toEqual(['Things', 'towns'])
  })

  it('never supports mean on the I mean reading', () => {
    expect(supportedTexts(readingOf('word-130'))).toEqual(['school', 'office'])
  })

  it("drops team's support on a recall of people", () => {
    expect(supportOf(recallOf('word-2', 'How many ____ are on your team?'), 'team')).toBeNull()
  })

  it("drops school's support on a recall of child", () => {
    expect(supportOf(recallOf('word-87', 'Is your ____ at school?'), 'school')).toBeNull()
  })

  it("drops station's support on a recall of build", () => {
    expect(supportOf(recallOf('word-16', 'Who will ____ the station?'), 'station')).toBeNull()
  })

  it("drops power's support on a recall of use", () => {
    expect(supportOf(recallOf('word-89', 'We ____ power at the factory.'), 'power')).toBeNull()
  })

  it("drops word's support on a recall of mean", () => {
    expect(supportOf(recallOf('word-108', 'What does this word ____?'), 'word')).toBeNull()
  })

  it("drops list's support on a recall of write", () => {
    expect(supportOf(recallOf('word-109', '____ your name on the list.'), 'list')).toBeNull()
  })

  it("drops write's support on a recall of word", () => {
    expect(supportOf(recallOf('word-52', 'Write this ____ on the list.'), 'Write')).toBeNull()
  })

  it('drops a support holding an accepted form of the answer on a recall', () => {
    const lessons = catalogWithEntry('word-109', { acceptedForms: ['call'] })

    expect(
      supportOf(recallOf('word-109', '____ your name on the list.', lessons), 'name'),
    ).toBeNull()
  })

  it('keeps a neighbour support holding no form of the answer on a recall', () => {
    expect(supportOf(recallOf('word-109', '____ your name on the list.'), 'name')).toEqual({
      shown: 'beside',
      text: 'the word that you call a person or thing',
      language: 'en',
    })
  })
})
