import { fileURLToPath } from 'node:url'
import { defaultMemoryTerms, Fief, Instant, noStoreFull, type Result } from '@mygame/domain'
import { describe, expect, it } from 'vitest'
import { JsonBuildingCatalog } from '../adapters/json/JsonBuildingCatalog'
import { JsonLessonCatalog } from '../adapters/json/JsonLessonCatalog'
import { fiefOverviewOf } from './fiefOverviewOf'

const shippedContent = fileURLToPath(new URL('../../content/', import.meta.url))

const storedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-10T08:57:30Z'))

const accepted = <T>(result: Result<T, unknown>): T => {
  if (!result.ok) {
    expect.fail(`expected an accepted result, got ${JSON.stringify(result.error)}`)
  }
  return result.value
}

const lessonStudyingFief = accepted(
  Fief.restore({
    id: '00000000-0000-4000-8000-00000000000d',
    playerId: 'player-learner',
    name: 'Robledal',
    address: { kingdom: 1, province: 5, plot: 3 },
    stocks: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    storedAt,
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
    studySlot: {
      kind: 'lesson',
      lessonId: 'lesson-1',
      startedAt: storedAt,
      finishesAt: Instant.fromEpochMilliseconds(storedAt.epochMilliseconds + 150_000),
    },
    recruitOrder: { kind: 'idle' },
    march: { kind: 'idle' },
    fullSince: noStoreFull,
    guidanceDismissedAt: null,
    skills: [],
  }),
)

describe('fiefOverviewOf', () => {
  it('answers the lesson the study slot holds with its start and its finish', () => {
    const terms = {
      buildingCatalog: JsonBuildingCatalog.fromDirectory(shippedContent),
      lessons: JsonLessonCatalog.fromDirectory(shippedContent),
      memoryTerms: defaultMemoryTerms,
    }
    const fullAt = { wood: null, stone: null, iron: null, gold: null, food: null }

    const overview = accepted(fiefOverviewOf({ fief: lessonStudyingFief, fullAt }, [], terms))

    expect(overview.study).toEqual({
      kind: 'lesson',
      lessonId: 'lesson-1',
      startedAt: '2026-11-10T08:57:30.000Z',
      finishesAt: '2026-11-10T09:00:00.000Z',
    })
  })
})
