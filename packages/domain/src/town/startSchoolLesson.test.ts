import { assert, describe, expect, it } from 'vitest'
import type { Lesson } from '../learning/Lesson'
import { MemoryCard } from '../memory/MemoryCard'
import type { Clock } from '../ports/Clock'
import { inMemoryCards, type OwnedCard } from '../testing/inMemoryCards'
import { inMemoryLessonSlots } from '../testing/inMemoryLessonSlots'
import { inMemoryLessons } from '../testing/inMemoryLessons'
import { inMemoryTownNews } from '../testing/inMemoryTownNews'
import { inMemoryTowns } from '../testing/inMemoryTowns'
import { lessonOne } from '../testing/lessonOne'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { type TownShape, townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import type { WorkSlot } from './BuildingWork'
import type { LessonSlot } from './LessonSlot'
import { startSchoolLesson } from './startSchoolLesson'
import type { TownCatalog } from './TownCatalog'

const MILLISECONDS_PER_HOUR = 3_600_000

const hoursAfterEpoch = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(
    plainTownSettings.seasons.epoch.epochMilliseconds + hours * MILLISECONDS_PER_HOUR,
  )

const secondsAfter = (instant: Instant, seconds: number): Instant =>
  Instant.fromEpochMilliseconds(instant.epochMilliseconds + seconds * 1000)

const springNow = hoursAfterEpoch(2)

const winterNow = hoursAfterEpoch(24 * 22)

const winterStudyAtThreeQuarters = townCatalogOf({
  ...plainTownSettings,
  seasons: {
    ...plainTownSettings.seasons,
    durationPercent: {
      ...plainTownSettings.seasons.durationPercent,
      winter: { build: 100, study: 75 },
    },
  },
})

const lessonTwo: Lesson = {
  ...lessonOne,
  id: 'lesson-2',
  requiredSchoolLevel: 2,
  words: lessonOne.words.map((word) => ({ ...word, id: `${word.id}-2` })),
}

type Setup = {
  readonly town?: Omit<TownShape, 'storedAt'>
  readonly cards?: ReadonlyArray<OwnedCard>
  readonly slot?: LessonSlot
  readonly now?: Instant
  readonly catalog?: TownCatalog
}

const schoolOf = ({
  town = {},
  cards = [],
  slot,
  now = springNow,
  catalog = townCatalogOf(),
}: Setup) => {
  const frozenClock: Clock = { now: () => now }
  const towns = inMemoryTowns([townOf({ storedAt: hoursAfterEpoch(1), ...town })])
  const dependencies = {
    towns,
    lessonSlots: inMemoryLessonSlots(slot === undefined ? [] : [{ townId: 'town-1', slot }]),
    cards: inMemoryCards(cards),
    lessons: inMemoryLessons([lessonOne, lessonTwo], []),
    news: inMemoryTownNews(),
    catalog,
    clock: frozenClock,
  }
  return {
    ...dependencies,
    start: (lessonId: string) =>
      startSchoolLesson({ playerId: 'player-1', lessonId }, dependencies),
  }
}

const cardsEnteredFor = (count: number): ReadonlyArray<OwnedCard> =>
  Array.from({ length: count }, (_, position) => ({
    playerId: 'player-1',
    wordId: `held-${position}`,
    card: MemoryCard.entered(hoursAfterEpoch(1)),
  }))

const farmFinishedAt = (finishesAt: Instant): WorkSlot => ({
  kind: 'busy',
  building: 'farm',
  level: 1,
  cost: { money: 0, food: 0, power: 0, material: 0 },
  startedAt: hoursAfterEpoch(1),
  finishesAt,
})

describe('startSchoolLesson', () => {
  it('starts a lesson in the idle school slot at no cost', async () => {
    const school = schoolOf({ town: { stocks: { money: 0, food: 0, power: 0, material: 0 } } })

    const started = await school.start('lesson-1')

    assert(started.ok)
    expect(started.value).toEqual({
      kind: 'busy',
      lessonId: 'lesson-1',
      startedAt: springNow,
      finishesAt: secondsAfter(springNow, 300),
    })
    expect(await school.lessonSlots.lessonSlotOf('town-1')).toEqual({
      ok: true,
      value: started.value,
    })
    expect(await school.towns.townOf('player-1')).toMatchObject({
      ok: true,
      value: { stocks: { money: 0, food: 0, power: 0, material: 0 } },
    })
  })

  it("shortens a lesson by the school's level and the study percent the town's season holds", async () => {
    const school = schoolOf({
      town: { buildingLevels: { school: 2 } },
      now: winterNow,
      catalog: winterStudyAtThreeQuarters,
    })

    const started = await school.start('lesson-1')

    assert(started.ok && started.value.kind === 'busy')
    expect(started.value.finishesAt).toEqual(secondsAfter(winterNow, 203))
  })

  it('refuses a lesson whose school level is too low', async () => {
    const school = schoolOf({})

    const started = await school.start('lesson-2')

    expect(started).toEqual({
      ok: false,
      error: { kind: 'LessonSchoolTooLow', requiredSchoolLevel: 2, schoolLevel: 1 },
    })
  })

  it('saves the town its resolve finished building work in', async () => {
    const school = schoolOf({ town: { workSlot: farmFinishedAt(hoursAfterEpoch(1.5)) } })

    await school.start('lesson-1')

    expect(school.towns.storedTownOf('player-1')?.buildingLevels.farm).toBe(1)
  })

  it('records the Town News of the work its resolve finished', async () => {
    const finishesAt = hoursAfterEpoch(1.5)
    const school = schoolOf({ town: { workSlot: farmFinishedAt(finishesAt) } })

    await school.start('lesson-1')

    expect(school.news.recordedEventsOf('town-1')).toEqual([
      { kind: 'buildingWorkFinished', building: 'farm', level: 1, occurredAt: finishesAt },
    ])
  })

  it('refuses a lesson with LearningCapReached when cards in learning plus its words pass the cap', async () => {
    const school = schoolOf({ cards: cardsEnteredFor(11) })

    const started = await school.start('lesson-1')

    expect(started).toEqual({
      ok: false,
      error: {
        kind: 'LearningCapReached',
        learningCap: 15,
        cardsInLearning: 11,
        lessonWordCount: 5,
      },
    })
  })

  it('starts a lesson that fills the cap exactly', async () => {
    const school = schoolOf({ cards: cardsEnteredFor(10) })

    const started = await school.start('lesson-1')

    expect(started.ok).toBe(true)
  })

  it("enters the lesson's cards at its finish", async () => {
    const finishesAt = hoursAfterEpoch(1.5)
    const school = schoolOf({
      town: { buildingLevels: { school: 2 } },
      slot: { kind: 'busy', lessonId: 'lesson-1', startedAt: hoursAfterEpoch(1), finishesAt },
    })

    const started = await school.start('lesson-2')

    assert(started.ok)
    const held = await school.cards.cardsOf('player-1')
    assert(held.ok)
    expect(held.value).toEqual(
      lessonOne.words.map(({ id }) => ({ wordId: id, card: MemoryCard.entered(finishesAt) })),
    )
  })

  it('records lessonStudied at the finish', async () => {
    const finishesAt = hoursAfterEpoch(1.5)
    const school = schoolOf({
      town: { buildingLevels: { school: 2 } },
      slot: { kind: 'busy', lessonId: 'lesson-1', startedAt: hoursAfterEpoch(1), finishesAt },
    })

    await school.start('lesson-2')

    expect(school.news.recordedEventsOf('town-1')).toEqual([
      { kind: 'lessonStudied', lessonId: 'lesson-1', occurredAt: finishesAt },
    ])
  })

  it('refuses a lesson whose cards the player already holds', async () => {
    const finishesAt = hoursAfterEpoch(1.5)
    const school = schoolOf({
      slot: { kind: 'busy', lessonId: 'lesson-1', startedAt: hoursAfterEpoch(1), finishesAt },
    })

    const started = await school.start('lesson-1')

    expect(started).toEqual({
      ok: false,
      error: { kind: 'LessonAlreadyStudied', lessonId: 'lesson-1' },
    })
  })

  it('writes nothing when it refuses', async () => {
    const finishesAt = hoursAfterEpoch(1.5)
    const finishedSlot: LessonSlot = {
      kind: 'busy',
      lessonId: 'lesson-1',
      startedAt: hoursAfterEpoch(1),
      finishesAt,
    }
    const school = schoolOf({ slot: finishedSlot })

    await school.start('lesson-1')

    expect(await school.cards.cardsOf('player-1')).toEqual({ ok: true, value: [] })
    expect(await school.lessonSlots.lessonSlotOf('town-1')).toEqual({
      ok: true,
      value: finishedSlot,
    })
    expect(school.news.recordedEventsOf('town-1')).toEqual([])
  })

  it('refuses the lesson the school slot is studying', async () => {
    const school = schoolOf({
      slot: {
        kind: 'busy',
        lessonId: 'lesson-1',
        startedAt: hoursAfterEpoch(1),
        finishesAt: hoursAfterEpoch(3),
      },
    })

    const started = await school.start('lesson-1')

    expect(started).toEqual({
      ok: false,
      error: { kind: 'LessonUnderStudy', lessonId: 'lesson-1' },
    })
  })

  it('refuses a lesson while the school slot studies another', async () => {
    const school = schoolOf({
      town: { buildingLevels: { school: 2 } },
      slot: {
        kind: 'busy',
        lessonId: 'lesson-1',
        startedAt: hoursAfterEpoch(1),
        finishesAt: hoursAfterEpoch(3),
      },
    })

    const started = await school.start('lesson-2')

    expect(started).toEqual({ ok: false, error: { kind: 'StudySlotBusy' } })
  })

  it('refuses a lesson the catalog lacks', async () => {
    const started = await schoolOf({}).start('lesson-9')

    expect(started).toEqual({ ok: false, error: { kind: 'LessonNotFound', lessonId: 'lesson-9' } })
  })

  it('refuses a player who holds no town', async () => {
    const school = schoolOf({})

    const started = await startSchoolLesson(
      { playerId: 'player-2', lessonId: 'lesson-1' },
      { ...school },
    )

    expect(started).toEqual({ ok: false, error: { kind: 'TownNotFound', playerId: 'player-2' } })
  })
})
