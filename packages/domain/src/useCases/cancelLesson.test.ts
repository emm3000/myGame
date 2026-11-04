import { assert, describe, expect, it } from 'vitest'
import { Fief, type StoredFief } from '../fief/Fief'
import { noStoreFull } from '../fief/FullSince'
import type { LessonStudySlot, StudySlot } from '../fief/StudySlot'
import type { Clock } from '../ports/Clock'
import { inMemoryChronicle } from '../testing/inMemoryChronicle'
import { inMemoryFiefRepository } from '../testing/inMemoryFiefRepository'
import { lessonOne } from '../testing/lessonOne'
import { Instant } from '../time/Instant'
import { cancelLesson } from './cancelLesson'

const startedAt = Instant.fromEpochMilliseconds(1_794_301_050_000)

const secondsAfterStart = (seconds: number): Instant =>
  Instant.fromEpochMilliseconds(startedAt.epochMilliseconds + seconds * 1_000)

const frozenClock = (instant: Instant): Clock => ({ now: () => instant })

const learner = 'player-learner'

const lessonStudy: LessonStudySlot = {
  kind: 'lesson',
  lessonId: lessonOne.id,
  startedAt,
  finishesAt: secondsAfterStart(150),
}

const studyingFief = (studySlot: StudySlot): Fief => {
  const stored: StoredFief = {
    id: 'fief-1',
    playerId: learner,
    name: 'Vado Viejo',
    address: { kingdom: 1, province: 3, plot: 1 },
    stocks: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    storedAt: startedAt,
    buildingLevels: {
      sawmill: 0,
      quarry: 0,
      ironMine: 0,
      farm: 0,
      warehouse: 0,
      library: 1,
      barracks: 0,
    },
    artLevels: { smithing: 0, masonry: 0 },
    units: { infantry: 0, cavalry: 0, archer: 0, settler: 0 },
    slot: { kind: 'idle' },
    buildQueue: [],
    studySlot,
    recruitOrder: { kind: 'idle' },
    march: { kind: 'idle' },
    fullSince: noStoreFull,
    guidanceDismissedAt: null,
    skills: [],
  }
  const restored = Fief.restore(stored)
  assert(restored.ok)
  return restored.value
}

const command = { playerId: learner, fiefId: 'fief-1', lessonId: lessonOne.id }

describe('cancelLesson', () => {
  it('idles the study slot and records the lesson cancelled', async () => {
    const fiefs = inMemoryFiefRepository([studyingFief(lessonStudy)])
    const chronicle = inMemoryChronicle()
    const cancelledAt = secondsAfterStart(60)

    const cancelled = await cancelLesson(command, {
      fiefs,
      chronicle,
      clock: frozenClock(cancelledAt),
    })

    assert(cancelled.ok)
    expect(fiefs.storedFiefOf('fief-1')?.studySlot).toEqual({ kind: 'idle' })
    expect(chronicle.recordedEventsOf('fief-1')).toEqual([
      { kind: 'lessonCancelled', lessonId: lessonOne.id, occurredAt: cancelledAt },
    ])
  })

  it('refunds nothing', async () => {
    const fief = studyingFief(lessonStudy)
    const fiefs = inMemoryFiefRepository([fief])

    const cancelled = await cancelLesson(command, {
      fiefs,
      chronicle: inMemoryChronicle(),
      clock: frozenClock(startedAt),
    })

    assert(cancelled.ok)
    expect(cancelled.value.fief.stocks).toEqual(fief.stocks)
  })

  it('refuses a lesson the study slot no longer holds', async () => {
    const fiefs = inMemoryFiefRepository([studyingFief(lessonStudy)])
    const chronicle = inMemoryChronicle()

    const cancelled = await cancelLesson(command, {
      fiefs,
      chronicle,
      clock: frozenClock(secondsAfterStart(150)),
    })

    expect(cancelled).toEqual({
      ok: false,
      error: { kind: 'LessonStudyNotFound', lessonId: lessonOne.id },
    })
    expect(chronicle.recordedEventsOf('fief-1')).toEqual([])
  })

  it('refuses an idle study slot', async () => {
    const cancelled = await cancelLesson(command, {
      fiefs: inMemoryFiefRepository([studyingFief({ kind: 'idle' })]),
      chronicle: inMemoryChronicle(),
      clock: frozenClock(startedAt),
    })

    expect(cancelled).toEqual({
      ok: false,
      error: { kind: 'LessonStudyNotFound', lessonId: lessonOne.id },
    })
  })
})
