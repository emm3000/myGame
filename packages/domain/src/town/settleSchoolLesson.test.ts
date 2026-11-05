import { describe, expect, it } from 'vitest'
import { MemoryCard } from '../memory/MemoryCard'
import type { Clock } from '../ports/Clock'
import { inMemoryBandStarts } from '../testing/inMemoryBandStarts'
import { inMemoryCards } from '../testing/inMemoryCards'
import { inMemoryLessonSlots } from '../testing/inMemoryLessonSlots'
import { inMemoryLessons } from '../testing/inMemoryLessons'
import { inMemoryTownNews } from '../testing/inMemoryTownNews'
import { inMemoryTowns } from '../testing/inMemoryTowns'
import { lessonOne } from '../testing/lessonOne'
import { plainTownSettings } from '../testing/townCatalogOf'
import { townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import type { LessonSlot } from './LessonSlot'
import { settleSchoolLesson } from './settleSchoolLesson'

const MILLISECONDS_PER_HOUR = 3_600_000

const hoursAfterEpoch = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(
    plainTownSettings.seasons.epoch.epochMilliseconds + hours * MILLISECONDS_PER_HOUR,
  )

const now = hoursAfterEpoch(2)

const finishesAt = hoursAfterEpoch(1.5)

const finishedLesson: LessonSlot = {
  kind: 'busy',
  lessonId: 'lesson-1',
  startedAt: hoursAfterEpoch(1),
  finishesAt,
}

const runningLesson: LessonSlot = {
  kind: 'busy',
  lessonId: 'lesson-1',
  startedAt: hoursAfterEpoch(1),
  finishesAt: hoursAfterEpoch(3),
}

const schoolOf = (slot: LessonSlot) => {
  const frozenClock: Clock = { now: () => now }
  const dependencies = {
    towns: inMemoryTowns([townOf({ storedAt: hoursAfterEpoch(1) })]),
    lessonSlots: inMemoryLessonSlots([{ townId: 'town-1', slot }]),
    bandStarts: inMemoryBandStarts([]),
    cards: inMemoryCards([]),
    lessons: inMemoryLessons([lessonOne], []),
    news: inMemoryTownNews(),
    clock: frozenClock,
  }
  return {
    ...dependencies,
    settle: (playerId = 'player-1') => settleSchoolLesson(playerId, dependencies),
  }
}

describe('settleSchoolLesson', () => {
  it("enters a finished lesson's cards at its finish", async () => {
    const school = schoolOf(finishedLesson)

    await school.settle()

    expect(await school.cards.cardsOf('player-1')).toEqual({
      ok: true,
      value: lessonOne.words.map(({ id }) => ({
        wordId: id,
        card: MemoryCard.entered(finishesAt),
      })),
    })
  })

  it('idles the school slot of a finished lesson', async () => {
    const school = schoolOf(finishedLesson)

    await school.settle()

    expect(await school.lessonSlots.lessonSlotOf('town-1')).toEqual({
      ok: true,
      value: { kind: 'idle' },
    })
  })

  it('records lessonStudied once however often it settles', async () => {
    const school = schoolOf(finishedLesson)

    await school.settle()
    await school.settle()

    expect(school.news.recordedEventsOf('town-1')).toEqual([
      { kind: 'lessonStudied', lessonId: 'lesson-1', occurredAt: finishesAt },
    ])
  })

  it('leaves a lesson still running untouched', async () => {
    const school = schoolOf(runningLesson)

    const settled = await school.settle()

    expect(settled).toEqual({ ok: true, value: undefined })
    expect(await school.lessonSlots.lessonSlotOf('town-1')).toEqual({
      ok: true,
      value: runningLesson,
    })
    expect(await school.cards.cardsOf('player-1')).toEqual({ ok: true, value: [] })
    expect(school.news.recordedEventsOf('town-1')).toEqual([])
  })

  it('does nothing for a player who holds no town', async () => {
    const school = schoolOf(finishedLesson)

    const settled = await school.settle('player-2')

    expect(settled).toEqual({ ok: true, value: undefined })
    expect(await school.cards.cardsOf('player-2')).toEqual({ ok: true, value: [] })
  })
})
