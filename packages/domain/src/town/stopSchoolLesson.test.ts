import { describe, expect, it } from 'vitest'
import type { Clock } from '../ports/Clock'
import { inMemoryCards } from '../testing/inMemoryCards'
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
import { stopSchoolLesson } from './stopSchoolLesson'

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

type Setup = {
  readonly town?: Omit<TownShape, 'storedAt'>
  readonly slot?: LessonSlot
}

const schoolOf = ({ town = {}, slot }: Setup) => {
  const frozenClock: Clock = { now: () => now }
  const dependencies = {
    towns: inMemoryTowns([townOf({ storedAt: hoursAfterEpoch(1), ...town })]),
    lessonSlots: inMemoryLessonSlots(slot === undefined ? [] : [{ townId: 'town-1', slot }]),
    cards: inMemoryCards([]),
    lessons: inMemoryLessons([lessonOne], []),
    news: inMemoryTownNews(),
    catalog: townCatalogOf(),
    clock: frozenClock,
  }
  return {
    ...dependencies,
    stop: (lessonId: string, playerId = 'player-1') =>
      stopSchoolLesson({ playerId, lessonId }, dependencies),
  }
}

describe('stopSchoolLesson', () => {
  it('idles the school slot that studies the lesson', async () => {
    const school = schoolOf({ slot: runningLesson })

    const stopped = await school.stop('lesson-1')

    expect(stopped).toEqual({ ok: true, value: undefined })
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
