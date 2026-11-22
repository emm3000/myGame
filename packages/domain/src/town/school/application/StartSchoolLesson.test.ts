import { assert, describe, expect, it } from 'vitest'
import { signedUpAccountsOf } from '#account/testing/signedUpAccountsOf'
import type { BandStart } from '#holdout/domain/BandStart'
import { inMemoryBandStarts, type OwnedBandStart } from '#holdout/testing/inMemoryBandStarts'
import type { Band } from '#learning/curriculum/Band'
import { inMemoryBands } from '#learning/curriculum/testing/inMemoryBands'
import { inMemoryLessons } from '#learning/curriculum/testing/inMemoryLessons'
import { lessonOne } from '#learning/curriculum/testing/lessonOne'
import type { Lesson } from '#learning/Lesson'
import { inMemoryCards, type OwnedCard } from '#learning/testing/inMemoryCards'
import { MemoryCard } from '#memory/domain/MemoryCard'
import type { Placement } from '#placement/domain/Placement'
import { inMemoryPlacements } from '#placement/testing/inMemoryPlacements'
import type { Clock } from '#platform/domain/Clock'
import type { RandomSource } from '#platform/domain/RandomSource'
import { firstItemsRandom } from '#platform/testing/firstItemsRandom'
import { inMemoryUnitOfWork } from '#platform/testing/inMemoryUnitOfWork'
import { Instant } from '#time/Instant'
import type { WorkSlot } from '../../building/domain/BuildingWork'
import type { TownCatalog } from '../../domain/TownCatalog'
import { inMemoryEarnedSkills } from '../../testing/inMemoryEarnedSkills'
import { type InMemoryTownNews, inMemoryTownNews } from '../../testing/inMemoryTownNews'
import { inMemoryTownStores, townNewsOver } from '../../testing/inMemoryTownStores'
import { inMemoryTowns } from '../../testing/inMemoryTowns'
import { plainTownSettings, townCatalogOf } from '../../testing/townCatalogOf'
import { type TownShape, townOf } from '../../testing/townFixtures'
import type { LessonSlot } from '../domain/LessonSlot'
import { inMemoryLessonSlots } from '../testing/inMemoryLessonSlots'
import { StartSchoolLesson, type StartSchoolLessonCommand } from './StartSchoolLesson'

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
      winter: { build: 100, study: 75, hire: 100, road: 100 },
    },
  },
})

const lessonTwo: Lesson = {
  ...lessonOne,
  id: 'lesson-2',
  requiredSchoolLevel: 2,
  words: lessonOne.words.map((word) => ({ ...word, id: `${word.id}-2` })),
}

const bandLesson: Lesson = {
  ...lessonOne,
  id: 'lesson-17',
  words: ['say', 'make', 'know', 'time', 'year'].map((id) => ({
    ...lessonOne.words[0],
    id: `word-${id}`,
    acceptedForms: [id],
    gloss: id,
    definition: `definition of ${id}`,
    frames: [{ frame: id, gappedFrame: id }],
  })),
}

const bandLessonTwo: Lesson = { ...bandLesson, id: 'lesson-18' }

const unitLessonOnBandOne: Lesson = {
  ...lessonOne,
  id: 'unit-lesson-1',
  words: ['make up', 'know of'].map((unit) => ({
    ...lessonOne.words[0],
    id: `unit-${unit.replace(' ', '-')}`,
    acceptedForms: [unit],
    gloss: unit,
    definition: `definition of ${unit}`,
    frames: [{ frame: unit, gappedFrame: unit }],
  })),
}

const cardWordsOfBandOne = [
  'say',
  'make',
  'know',
  'time',
  'year',
  'think',
  'see',
  'come',
  'want',
  'look',
  'use',
  'find',
  'give',
  'tell',
  'take',
  'good',
  'new',
  'first',
  'last',
  'long',
  'great',
].map((headword) => ({ headword, isChrome: false }))

const chromeWordsOfBandOne = ['home', 'school'].map((headword) => ({ headword, isChrome: true }))

const bandsOf = inMemoryBands([
  {
    band: 1,
    lessonIds: ['lesson-17', 'lesson-18'],
    words: [...chromeWordsOfBandOne, ...cardWordsOfBandOne],
  },
])

const placementPassing = (bands: ReadonlyArray<Band>): Placement => ({
  kind: 'taken',
  begunAt: hoursAfterEpoch(1),
  samples: [],
  scores: bands.map((band) => ({ band, score: 29, takenAt: hoursAfterEpoch(1) })),
})

type LessonFixture = {
  readonly towns: ReturnType<typeof inMemoryTowns>
  readonly lessonSlots: ReturnType<typeof inMemoryLessonSlots>
  readonly cards: ReturnType<typeof inMemoryCards>
  readonly lessons: ReturnType<typeof inMemoryLessons>
  readonly bandStarts: ReturnType<typeof inMemoryBandStarts>
  readonly bands: ReturnType<typeof inMemoryBands>
  readonly placements: ReturnType<typeof inMemoryPlacements>
  readonly random: RandomSource
  readonly news: InMemoryTownNews
  readonly catalog: TownCatalog
  readonly clock: Clock
}

const startWith = (
  command: StartSchoolLessonCommand,
  { lessons, bands, news, catalog, random, clock, ...held }: LessonFixture,
): ReturnType<StartSchoolLesson['execute']> =>
  new StartSchoolLesson({
    unitOfWork: inMemoryUnitOfWork(
      inMemoryTownStores({
        ...held,
        accounts: signedUpAccountsOf(['player-1']),
        townNews: townNewsOver(news),
      }),
    ),
    townCatalog: catalog,
    random,
    lessons: { ...lessons, ...bands },
    clock,
  }).execute(command)

type Setup = {
  readonly bandStarts?: ReadonlyArray<OwnedBandStart>
  readonly placedOut?: ReadonlyArray<Band>
  readonly random?: RandomSource
  readonly town?: Omit<TownShape, 'storedAt'>
  readonly cards?: ReadonlyArray<OwnedCard>
  readonly slot?: LessonSlot
  readonly now?: Instant
  readonly catalog?: TownCatalog
}

const schoolOf = ({
  bandStarts = [],
  placedOut = [],
  random = firstItemsRandom,
  town = {},
  cards = [],
  slot,
  now = springNow,
  catalog = townCatalogOf(),
}: Setup) => {
  const frozenClock: Clock = { now: () => now }
  const towns = inMemoryTowns(
    [townOf({ storedAt: hoursAfterEpoch(1), ...town })],
    inMemoryEarnedSkills([]),
  )
  const dependencies = {
    towns,
    lessonSlots: inMemoryLessonSlots(slot === undefined ? [] : [{ townId: 'town-1', slot }]),
    cards: inMemoryCards(cards),
    lessons: inMemoryLessons(
      [lessonOne, lessonTwo, bandLesson, bandLessonTwo, unitLessonOnBandOne],
      [],
    ),
    bandStarts: inMemoryBandStarts(bandStarts),
    bands: bandsOf,
    placements: inMemoryPlacements(
      placedOut.length === 0
        ? []
        : [{ playerId: 'player-1', placement: placementPassing(placedOut) }],
    ),
    random,
    news: inMemoryTownNews(),
    catalog,
    clock: frozenClock,
  }
  return {
    ...dependencies,
    start: (lessonId: string) => startWith({ playerId: 'player-1', lessonId }, dependencies),
  }
}

const cardsEnteredFor = (count: number): ReadonlyArray<OwnedCard> =>
  Array.from({ length: count }, (_, position) => ({
    playerId: 'player-1',
    wordId: `held-${position}`,
    card: MemoryCard.entered(hoursAfterEpoch(1)),
  }))

const unitCardEntered = (wordId: string): OwnedCard => ({
  playerId: 'player-1',
  wordId,
  card: MemoryCard.entered(hoursAfterEpoch(1)),
})

const farmFinishedAt = (finishesAt: Instant): WorkSlot => ({
  kind: 'busy',
  building: 'farm',
  level: 1,
  cost: { money: 0, food: 0, power: 0, material: 0 },
  startedAt: hoursAfterEpoch(1),
  finishesAt,
})

describe('StartSchoolLesson', () => {
  it("draws a tenth of the band's card words at the band's start", async () => {
    const school = schoolOf({})

    await school.start('lesson-17')

    expect(await school.bandStarts.bandStartsOf('player-1')).toEqual({
      ok: true,
      value: [{ band: 1, startedAt: springNow, heldOutWords: ['make', 'say'], checks: [] }],
    })
  })

  it("never draws a chrome lesson's word", async () => {
    const everyWordChrome = inMemoryBands([
      {
        band: 1,
        lessonIds: ['lesson-17'],
        words: Array.from({ length: 20 }, (_, position) => ({
          headword: `chrome-${position}`,
          isChrome: true,
        })),
      },
    ])
    const school = schoolOf({})

    await startWith(
      { playerId: 'player-1', lessonId: 'lesson-17' },
      { ...school, bands: everyWordChrome },
    )

    expect(await school.bandStarts.bandStartsOf('player-1')).toEqual({
      ok: true,
      value: [{ band: 1, startedAt: springNow, heldOutWords: [], checks: [] }],
    })
  })

  it('never holds out a word an entered unit card holds', async () => {
    const school = schoolOf({ cards: [unitCardEntered('unit-make-up')] })

    await school.start('lesson-17')

    expect(await school.bandStarts.bandStartsOf('player-1')).toEqual({
      ok: true,
      value: [{ band: 1, startedAt: springNow, heldOutWords: ['know', 'say'], checks: [] }],
    })
  })

  it("still holds out a tenth of the band's card words when unit cards hold some", async () => {
    const school = schoolOf({
      cards: [unitCardEntered('unit-make-up'), unitCardEntered('unit-know-of')],
    })

    await school.start('lesson-17')

    expect(await school.bandStarts.bandStartsOf('player-1')).toEqual({
      ok: true,
      value: [{ band: 1, startedAt: springNow, heldOutWords: ['say', 'time'], checks: [] }],
    })
  })

  it('draws nothing when a chrome lesson starts', async () => {
    const school = schoolOf({})

    await school.start('lesson-1')

    expect(await school.bandStarts.bandStartsOf('player-1')).toEqual({ ok: true, value: [] })
  })

  it('never draws for a placed-out band', async () => {
    const school = schoolOf({ placedOut: [1] })

    const started = await school.start('lesson-17')

    expect(started.ok).toBe(true)
    expect(await school.bandStarts.bandStartsOf('player-1')).toEqual({ ok: true, value: [] })
  })

  it("keeps the draw and the instant of the band's start when a later lesson starts", async () => {
    const stored: BandStart = {
      band: 1,
      startedAt: hoursAfterEpoch(1),
      heldOutWords: ['think', 'see'],
      checks: [],
    }
    const school = schoolOf({ bandStarts: [{ playerId: 'player-1', start: stored }] })

    await school.start('lesson-18')

    expect(await school.bandStarts.bandStartsOf('player-1')).toEqual({ ok: true, value: [stored] })
  })

  it('never reads the random source once the band has started', async () => {
    const sampledCounts: Array<number> = []
    const recordingRandom: RandomSource = {
      sampleOf: (items, count) => {
        sampledCounts.push(count)
        return items.slice(0, count)
      },
    }
    const stored: BandStart = {
      band: 1,
      startedAt: hoursAfterEpoch(1),
      heldOutWords: ['think', 'see'],
      checks: [],
    }
    const school = schoolOf({
      bandStarts: [{ playerId: 'player-1', start: stored }],
      random: recordingRandom,
    })

    await school.start('lesson-18')

    expect(sampledCounts).toEqual([])
  })

  it("admits a lesson its own start's draw brings under the learning cap", async () => {
    const school = schoolOf({ cards: cardsEnteredFor(12) })

    const started = await school.start('lesson-17')

    expect(started.ok).toBe(true)
  })

  it('stores no draw for a lesson it refuses', async () => {
    const school = schoolOf({ cards: cardsEnteredFor(13) })

    const refused = await school.start('lesson-17')

    expect(refused.ok).toBe(false)
    expect(await school.bandStarts.bandStartsOf('player-1')).toEqual({ ok: true, value: [] })
  })

  it('counts only the words the player will hold against the learning cap', async () => {
    const withoutMake: BandStart = {
      band: 1,
      startedAt: hoursAfterEpoch(1),
      heldOutWords: ['make'],
      checks: [],
    }
    const school = schoolOf({
      cards: cardsEnteredFor(11),
      bandStarts: [{ playerId: 'player-1', start: withoutMake }],
    })

    const started = await school.start('lesson-17')

    expect(started.ok).toBe(true)
  })

  it('starts a lesson in the idle school slot at no cost', async () => {
    const school = schoolOf({ town: { stocks: { money: 0, food: 0, power: 0, material: 0 } } })

    const started = await school.start('lesson-1')

    assert(started.ok)
    expect(started.value.lessonSlot).toEqual({
      kind: 'busy',
      lessonId: 'lesson-1',
      startedAt: springNow,
      finishesAt: secondsAfter(springNow, 300),
    })
    expect(await school.lessonSlots.lessonSlotOf('town-1')).toEqual({
      ok: true,
      value: started.value.lessonSlot,
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

    assert(started.ok && started.value.lessonSlot.kind === 'busy')
    expect(started.value.lessonSlot.finishesAt).toEqual(secondsAfter(winterNow, 203))
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
      ['food', 'home', 'money', 'school', 'work'].map((wordId) => ({
        wordId,
        card: MemoryCard.entered(finishesAt),
      })),
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

    const started = await startWith({ playerId: 'player-2', lessonId: 'lesson-1' }, { ...school })

    expect(started).toEqual({ ok: false, error: { kind: 'TownNotFound', playerId: 'player-2' } })
  })
})
