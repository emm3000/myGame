import { describe, expect, it } from 'vitest'
import { inMemoryBandStarts } from '#holdout/testing/inMemoryBandStarts'
import { inMemoryBands } from '#learning/curriculum/testing/inMemoryBands'
import { inMemoryLessons } from '#learning/curriculum/testing/inMemoryLessons'
import { lessonOne } from '#learning/curriculum/testing/lessonOne'
import { inMemoryCards } from '#learning/testing/inMemoryCards'
import type { Clock } from '#platform/domain/Clock'
import { inMemoryUnitOfWork } from '#platform/testing/inMemoryUnitOfWork'
import { Instant } from '#time/Instant'
import type { WorkSlot } from '../../building/domain/BuildingWork'
import { inMemoryEarnedSkills } from '../../testing/inMemoryEarnedSkills'
import { type InMemoryTownNews, inMemoryTownNews } from '../../testing/inMemoryTownNews'
import { inMemoryTowns } from '../../testing/inMemoryTowns'
import { signedUpTownStoresOf } from '../../testing/signedUpTownStoresOf'
import { plainTownSettings, townCatalogOf } from '../../testing/townCatalogOf'
import { type TownShape, townOf } from '../../testing/townFixtures'
import type { LessonSlot } from '../domain/LessonSlot'
import { inMemoryLessonSlots } from '../testing/inMemoryLessonSlots'
import { StopSchoolLesson, type StopSchoolLessonCommand } from './StopSchoolLesson'

const MILLISECONDS_PER_HOUR = 3_600_000

const hoursAfterEpoch = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(
    plainTownSettings.seasons.epoch.epochMilliseconds + hours * MILLISECONDS_PER_HOUR,
  )

const now = hoursAfterEpoch(2)

const runningLesson: LessonSlot = {
  kind: 'busy',
  lessonId: 'lesson-1',
  startedAt: hoursAfterEpoch(1.5),
  finishesAt: hoursAfterEpoch(3),
}

const finishedLesson: LessonSlot = {
  kind: 'busy',
  lessonId: 'lesson-1',
  startedAt: hoursAfterEpoch(1),
  finishesAt: now,
}

const farmFinishedAt = (finishesAt: Instant): WorkSlot => ({
  kind: 'busy',
  building: 'farm',
  level: 1,
  cost: { money: 0, food: 0, power: 0, material: 0 },
  startedAt: hoursAfterEpoch(1),
  finishesAt,
})

type LessonFixture = {
  readonly towns: ReturnType<typeof inMemoryTowns>
  readonly lessonSlots: ReturnType<typeof inMemoryLessonSlots>
  readonly bandStarts: ReturnType<typeof inMemoryBandStarts>
  readonly cards: ReturnType<typeof inMemoryCards>
  readonly lessons: ReturnType<typeof inMemoryLessons>
  readonly bands: ReturnType<typeof inMemoryBands>
  readonly news: InMemoryTownNews
  readonly catalog: ReturnType<typeof townCatalogOf>
  readonly clock: Clock
}

const stopWith = (
  command: StopSchoolLessonCommand,
  { lessons, bands, news, catalog, clock, ...held }: LessonFixture,
): ReturnType<StopSchoolLesson['execute']> =>
  new StopSchoolLesson({
    unitOfWork: inMemoryUnitOfWork(
      signedUpTownStoresOf({
        ...held,
        news,
      }),
    ),
    townCatalog: catalog,
    lessons: { ...lessons, ...bands },
    clock,
  }).execute(command)

type Setup = {
  readonly town?: Omit<TownShape, 'storedAt'>
  readonly slot?: LessonSlot
}

const schoolOf = ({ town = {}, slot }: Setup) => {
  const frozenClock: Clock = { now: () => now }
  const dependencies = {
    towns: inMemoryTowns(
      [townOf({ storedAt: hoursAfterEpoch(1), ...town })],
      inMemoryEarnedSkills([]),
    ),
    lessonSlots: inMemoryLessonSlots(slot === undefined ? [] : [{ townId: 'town-1', slot }]),
    bandStarts: inMemoryBandStarts([]),
    cards: inMemoryCards([]),
    lessons: inMemoryLessons([lessonOne], []),
    bands: inMemoryBands([]),
    news: inMemoryTownNews(),
    catalog: townCatalogOf(),
    clock: frozenClock,
  }
  return {
    ...dependencies,
    stop: (lessonId: string, playerId = 'player-1') =>
      stopWith({ playerId, lessonId }, dependencies),
  }
}

describe('StopSchoolLesson', () => {
  it('idles the school slot that studies the lesson', async () => {
    const school = schoolOf({ slot: runningLesson })

    const stopped = await school.stop('lesson-1')

    expect(stopped.ok).toBe(true)
    expect(await school.lessonSlots.lessonSlotOf('town-1')).toEqual({
      ok: true,
      value: { kind: 'idle' },
    })
  })

  it('records lessonStopped at the stop', async () => {
    const school = schoolOf({ slot: runningLesson })

    await school.stop('lesson-1')

    expect(school.news.recordedEventsOf('town-1')).toEqual([
      { kind: 'lessonStopped', lessonId: 'lesson-1', occurredAt: now },
    ])
  })

  it('refuses a lesson that finished by now, since the read studies it first', async () => {
    const school = schoolOf({ slot: finishedLesson })

    const stopped = await school.stop('lesson-1')

    expect(stopped).toEqual({
      ok: false,
      error: { kind: 'LessonStudyNotFound', lessonId: 'lesson-1' },
    })
  })

  it('refuses a lesson the school slot is not studying', async () => {
    const school = schoolOf({})

    const stopped = await school.stop('lesson-1')

    expect(stopped).toEqual({
      ok: false,
      error: { kind: 'LessonStudyNotFound', lessonId: 'lesson-1' },
    })
  })

  it('records the Town News of the work its resolve finished before the stop', async () => {
    const finishesAt = hoursAfterEpoch(1.5)
    const school = schoolOf({ town: { workSlot: farmFinishedAt(finishesAt) }, slot: runningLesson })

    await school.stop('lesson-1')

    expect(school.towns.storedTownOf('player-1')?.buildingLevels.farm).toBe(1)
    expect(school.news.recordedEventsOf('town-1')).toEqual([
      { kind: 'buildingWorkFinished', building: 'farm', level: 1, occurredAt: finishesAt },
      { kind: 'lessonStopped', lessonId: 'lesson-1', occurredAt: now },
    ])
  })

  it('refuses a player who holds no town', async () => {
    const stopped = await schoolOf({ slot: runningLesson }).stop('lesson-1', 'player-2')

    expect(stopped).toEqual({ ok: false, error: { kind: 'TownNotFound', playerId: 'player-2' } })
  })
})
