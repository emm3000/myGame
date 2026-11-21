import { en, es } from '@mygame/catalog'
import type { OpenText, Report, TownOverview } from '@mygame/contracts'
import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import type { CopyLanguage } from '../copy/playerCopyOf'
import { shownLinesDrawnAlone } from '../town/lineDrawnAlone.testSupport'

const spanishPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'scaffold' }
const bothPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'both' }
const englishPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'english' }
const noScaffold: CopyLanguage = { scaffold: 'none', chromePhase: 'english' }

type Lesson = TownOverview['lessons'][number]
type LessonWord = Lesson['words'][number]

const readableWord = (word: string): LessonWord => ({
  wordId: `id-${word}`,
  standing: 'recognize',
  reading: { word, frame: [{ text: `A ${word}.`, support: null }] },
  support: { shown: 'beside', text: `gloss of ${word}`, language: 'es' },
})

const lessonOf = (words: ReadonlyArray<LessonWord>): Lesson => ({
  id: 'lesson-1',
  theme: 'Theme 1',
  durationSeconds: 300,
  requiredSchoolLevel: 1,
  skill: { resource: 'food', ratePercent: 5 },
  isStudied: true,
  words: [...words],
})

const twoWords = lessonOf([readableWord('home'), readableWord('town')])

const oneWord = lessonOf([readableWord('home')])

const nothingToRead = lessonOf([{ ...readableWord('home'), reading: null }])

const noReviewsAhead: Report = {
  dueCount: 0,
  due: [],
  readFirst: [],
  nextDueAt: null,
  readAt: knownTown.readAt,
  news: [],
}

const openText: OpenText = {
  id: 'text-1',
  title: 'A New Course',
  sentences: [[{ text: 'I live in a little old house.', support: null }]],
}

const servingLessonIn = (language: CopyLanguage, lesson: Lesson): ApiClient =>
  stubApiClient({
    currentPlayer: async () => ({ ...knownPlayer, ...language }),
    town: async () => ({ ok: true, value: { ...knownTown, ...language, lessons: [lesson] } }),
    report: async () => ({ ok: true, value: noReviewsAhead }),
    text: async () => ({ ok: true, value: { kind: 'open', text: openText } }),
  })

it('titles the lesson in Spanish alone in the Spanish phase', async () => {
  renderAppAt('/school/lesson-1', servingLessonIn(spanishPhase, twoWords))

  expect(
    await screen.findByRole('heading', { level: 1, name: es.schoolLessonTitle({ number: 1 }) }),
  ).toBeDefined()
})

it('titles the lesson in English over Spanish in the both phase', async () => {
  renderAppAt('/school/lesson-1', servingLessonIn(bothPhase, twoWords))

  const english = en.schoolLessonTitle({ number: 1 })
  const spanish = es.schoolLessonTitle({ number: 1 })

  expect(
    await screen.findByRole('heading', { level: 1, name: `${english} ${spanish}` }),
  ).toBeDefined()
})

it('keeps a released lesson title in Spanish for an es player in the English phase', async () => {
  const released: TownOverview['releasedLessons'][number] = {
    id: 'released-2-1',
    band: 2,
    position: 1,
    durationSeconds: 300,
    requiredSchoolLevel: 1,
    isStudied: true,
    words: twoWords.words,
  }
  renderAppAt(
    '/school/released-2-1',
    stubApiClient({
      currentPlayer: async () => ({ ...knownPlayer, ...englishPhase }),
      town: async () => ({
        ok: true,
        value: { ...knownTown, ...englishPhase, lessons: [oneWord], releasedLessons: [released] },
      }),
      report: async () => ({ ok: true, value: noReviewsAhead }),
    }),
  )

  const title = es.schoolReleasedTitle({ band: 2, number: 1 })
  await screen.findByRole('heading', { level: 1, name: title })

  expect(shownLinesDrawnAlone(title, 'es')).toHaveLength(1)
})

it('walks the words in English alone in the English phase', async () => {
  renderAppAt('/school/lesson-1', servingLessonIn(englishPhase, twoWords))

  expect(await screen.findByRole('button', { name: en.schoolLessonWordNext() })).toBeDefined()
  expect(screen.getByText(en.schoolLessonWordPosition({ number: 1, count: 2 }))).toBeDefined()
})

it('names the way on to the reviews in English under none', async () => {
  renderAppAt('/school/lesson-1', servingLessonIn(noScaffold, oneWord))

  expect(await screen.findByRole('link', { name: en.reportStartReviews() })).toBeDefined()
})

it('says there is nothing to read in English under none', async () => {
  renderAppAt('/school/lesson-1', servingLessonIn(noScaffold, nothingToRead))

  expect(await screen.findByText(en.schoolLessonNothingToRead())).toBeDefined()
  expect(screen.getByRole('link', { name: en.townGoToSchool() })).toBeDefined()
})

it('names the way back from a text to the school in English under none', async () => {
  renderAppAt('/school/texts/text-1', servingLessonIn(noScaffold, twoWords))

  expect(await screen.findByRole('link', { name: en.townGoToSchool() })).toBeDefined()
})
