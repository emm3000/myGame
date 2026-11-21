import { en, es } from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts'
import { screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'

type CopyLanguage = Pick<TownOverview, 'scaffold' | 'chromePhase'>

const spanishPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'scaffold' }
const bothPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'both' }
const englishPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'english' }
const noScaffold: CopyLanguage = { scaffold: 'none', chromePhase: 'english' }

type Lesson = TownOverview['lessons'][number]

const lessonOf = (number: number, overrides: Partial<Lesson> = {}): Lesson => ({
  id: `lesson-${number}`,
  theme: `Theme ${number}`,
  durationSeconds: 300,
  requiredSchoolLevel: 1,
  skill: { resource: 'food', ratePercent: 5 },
  isStudied: false,
  words: Array.from({ length: 5 }, (_, index) => ({
    wordId: `lesson-${number}-${index + 1}`,
    standing: 'recognize',
    reading: null,
    support: { shown: 'beside', text: 'gloss', language: 'es' },
  })),
  ...overrides,
})

const busySchool: Partial<TownOverview> = {
  lessons: [lessonOf(1, { isStudied: true }), lessonOf(2)],
  dueHoldoutChecks: [{ band: 1, week: 8 }],
  bandLines: [{ band: 1, count: 2, total: 40 }],
  texts: [{ id: 'text-1', title: 'A day in town' }],
}

const servingSchoolIn = (language: CopyLanguage, town: Partial<TownOverview> = {}): ApiClient =>
  stubApiClient({
    currentPlayer: async () => ({ ...knownPlayer, ...language }),
    town: async () => ({ ok: true, value: { ...knownTown, ...busySchool, ...language, ...town } }),
  })

const schoolTitled = (name: string): Promise<HTMLElement> =>
  screen.findByRole('heading', { level: 1, name })

const sectionNamed = async (name: string): Promise<HTMLElement> =>
  screen.findByRole('region', { name })

it('titles the school in Spanish alone in the Spanish phase', async () => {
  renderAppAt('/school', servingSchoolIn(spanishPhase))

  expect(await schoolTitled(es.namesPlacesSchool())).toBeDefined()
})

it('titles the school in English over Spanish in the both phase', async () => {
  renderAppAt('/school', servingSchoolIn(bothPhase))

  expect(await schoolTitled(`${en.namesPlacesSchool()} ${es.namesPlacesSchool()}`)).toBeDefined()
})

it('titles the school in English alone in the English phase', async () => {
  renderAppAt('/school', servingSchoolIn(englishPhase))

  expect(await schoolTitled(en.namesPlacesSchool())).toBeDefined()
})

it('titles the school in English under none', async () => {
  renderAppAt('/school', servingSchoolIn(noScaffold))

  expect(await schoolTitled(en.namesPlacesSchool())).toBeDefined()
})

it('heads the lessons in English over Spanish in the both phase', async () => {
  renderAppAt('/school', servingSchoolIn(bothPhase))

  expect(await sectionNamed(`${en.schoolLessons()} ${es.schoolLessons()}`)).toBeDefined()
})

it('marks a studied lesson in English alone in the English phase', async () => {
  const unread = lessonOf(1, { isStudied: true }).words.map((word) => ({
    ...word,
    standing: 'notStarted' as const,
  }))
  renderAppAt(
    '/school',
    servingSchoolIn(englishPhase, {
      lessons: [lessonOf(1, { isStudied: true, words: unread }), lessonOf(2)],
    }),
  )

  const lessons = await sectionNamed(en.schoolLessons())

  expect(within(lessons).getByText(en.schoolLessonStudied())).toBeDefined()
})

it('marks the shown lesson under study in English alone in the English phase', async () => {
  renderAppAt(
    '/school',
    servingSchoolIn(englishPhase, {
      lessonSlot: {
        lessonId: 'lesson-2',
        startedAt: knownTown.readAt,
        finishesAt: '2100-01-01T00:00:00.000Z',
      },
    }),
  )

  const shownLesson = await screen.findByRole('region', {
    name: en.schoolLessonTitle({ number: 2 }),
  })

  expect(within(shownLesson).getByText(en.schoolLessonStudying())).toBeDefined()
})

it('counts the words in learning in English alone in the English phase', async () => {
  renderAppAt('/school', servingSchoolIn(englishPhase))

  const { inLearning, cap } = knownTown.learning

  expect(await screen.findByText(en.schoolLearning({ inLearning, cap }))).toBeDefined()
})

it('heads the texts in English under none', async () => {
  renderAppAt('/school', servingSchoolIn(noScaffold))

  expect(await sectionNamed(en.schoolTexts())).toBeDefined()
})

it('names the steps of the school path in English over Spanish in the both phase', async () => {
  renderAppAt('/school', servingSchoolIn(bothPhase))

  const [firstStep] = await screen.findAllByRole('term')

  expect(firstStep?.textContent).toBe(`${en.schoolPathStudied()} ${es.schoolPathStudied()}`)
})

it('heads the skills and their empty line in English under none', async () => {
  renderAppAt('/school', servingSchoolIn(noScaffold, { skills: [] }))

  const skills = await sectionNamed(en.schoolSkills())

  expect(within(skills).getByText(en.schoolSkillsNone())).toBeDefined()
})

it('keeps the due holdout check in Spanish for an es player in the English phase', async () => {
  renderAppAt('/school', servingSchoolIn(englishPhase))

  expect(await screen.findByText(es.schoolHoldoutCheckRow({ band: 1, week: 8 }))).toBeDefined()
  expect(screen.getByRole('link', { name: es.schoolHoldoutCheckOpen() })).toBeDefined()
})

it('writes the due holdout check in English under none', async () => {
  renderAppAt('/school', servingSchoolIn(noScaffold))

  expect(await screen.findByText(en.schoolHoldoutCheckRow({ band: 1, week: 8 }))).toBeDefined()
  expect(screen.getByRole('link', { name: en.schoolHoldoutCheckOpen() })).toBeDefined()
})

it('keeps the band line in Spanish for an es player in the English phase', async () => {
  renderAppAt('/school', servingSchoolIn(englishPhase))

  expect(await screen.findByText(es.schoolBandLine({ band: 1, count: 2, total: 40 }))).toBeDefined()
})

it('writes the band line in English under none', async () => {
  renderAppAt('/school', servingSchoolIn(noScaffold))

  expect(await screen.findByText(en.schoolBandLine({ band: 1, count: 2, total: 40 }))).toBeDefined()
})

const studyingLessonTwo: Partial<TownOverview> = {
  lessonSlot: {
    lessonId: 'lesson-2',
    startedAt: knownTown.readAt,
    finishesAt: '2100-01-01T00:00:00.000Z',
  },
}

const releasedSetOne: TownOverview['releasedLessons'][number] = {
  id: 'released-2-1',
  band: 2,
  position: 1,
  durationSeconds: 300,
  requiredSchoolLevel: 1,
  isStudied: false,
  words: lessonOf(9).words,
}

it('names the study button in English over Spanish in the both phase', async () => {
  renderAppAt('/school', servingSchoolIn(bothPhase))

  const english = `${en.schoolLessonStudy({ number: 2 })} · 5:00`
  const spanish = `${es.schoolLessonStudy({ number: 2 })} · 5:00`

  expect(await screen.findByRole('button', { name: `${english} ${spanish}` })).toBeDefined()
})

it('gives the reason a lesson waits in English alone in the English phase', async () => {
  renderAppAt(
    '/school',
    servingSchoolIn(englishPhase, { lessons: [lessonOf(1, { requiredSchoolLevel: 3 })] }),
  )

  expect(await screen.findByText(en.schoolLessonNeedsSchool({ level: 3 }))).toBeDefined()
})

it('writes the words and the skill of a lesson in English under none', async () => {
  renderAppAt('/school', servingSchoolIn(noScaffold))

  const words = en.schoolLessonWords({ count: 5 })
  const reward = en.schoolLessonReward({ percent: 5, resource: en.namesTownResourcesFood() })

  const shownLesson = await screen.findByRole('region', {
    name: en.schoolLessonTitle({ number: 2 }),
  })

  expect(shownLesson.textContent).toContain(`${words} · ${reward}`)
})

it('names a lesson row in English alone in the English phase', async () => {
  renderAppAt('/school', servingSchoolIn(englishPhase))

  expect(
    await screen.findByRole('listitem', { name: en.schoolLessonTitle({ number: 1 }) }),
  ).toBeDefined()
})

it('keeps a released lesson in Spanish for an es player in the English phase', async () => {
  renderAppAt('/school', servingSchoolIn(englishPhase, { releasedLessons: [releasedSetOne] }))

  const title = es.schoolReleasedTitle({ band: 2, number: 1 })

  expect(await screen.findByRole('listitem', { name: title })).toBeDefined()
  expect(
    screen.getByRole('button', { name: `${title} · ${es.schoolReleasedStudy()} · 5:00` }),
  ).toBeDefined()
})

it('writes a released lesson in English under none', async () => {
  renderAppAt('/school', servingSchoolIn(noScaffold, { releasedLessons: [releasedSetOne] }))

  expect(
    await screen.findByRole('listitem', { name: en.schoolReleasedTitle({ band: 2, number: 1 }) }),
  ).toBeDefined()
})

it('heads the study slot and its stop in English alone in the English phase', async () => {
  renderAppAt('/school', servingSchoolIn(englishPhase, studyingLessonTwo))

  expect(
    await screen.findByRole('button', { name: en.schoolSlotStopOf({ number: 2 }) }),
  ).toBeDefined()
  expect(screen.getByText(en.schoolSlotRefund())).toBeDefined()
})

it('names an earned skill in English under none', async () => {
  renderAppAt(
    '/school',
    servingSchoolIn(noScaffold, {
      skills: [
        { lessonId: 'lesson-1', resource: 'food', ratePercent: 5, earnedAt: knownTown.readAt },
      ],
    }),
  )

  const food = en.namesTownResourcesFood()

  expect(await screen.findByText(en.schoolSkillName({ resource: food, level: 1 }))).toBeDefined()
  expect(screen.getByText(en.schoolSkillRate({ percent: 5, resource: food }))).toBeDefined()
})
