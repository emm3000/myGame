import { join } from 'node:path'
import {
  defaultMemoryTerms,
  type HeldCard,
  Instant,
  idleLessonSlot,
  MemoryCard,
  Town,
  TownAddress,
  TownName,
} from '@mygame/domain'
import { assert, describe, expect, it } from 'vitest'
import { JsonLessonCatalog } from '../adapters/json/JsonLessonCatalog'
import { JsonTownCatalog } from '../adapters/json/JsonTownCatalog'
import { apiPackagePath } from '../apiPackagePath.testSupport'
import type { TownReading } from '../town/TownReading'
import { schoolOverviewOf } from './schoolOverviewOf'

const contentDirectory = apiPackagePath('content/')

const lessons = JsonLessonCatalog.fromDirectory(contentDirectory)

const townCatalog = JsonTownCatalog.fromDirectory(join(contentDirectory, 'town'))

const instantAt = (iso: string): Instant => Instant.fromEpochMilliseconds(Date.parse(iso))

const foundedTown = (): Town => {
  const address = TownAddress.create(1, 1, 1)
  const name = TownName.create('Maple Falls')
  assert(address.ok && name.ok)
  return Town.found({
    id: '00000000-0000-4000-8000-00000000000a',
    playerId: '00000000-0000-4000-8000-000000000001',
    name: name.value,
    address: address.value,
    startingStocks: { money: 400, food: 300, power: 200, material: 500 },
    skills: [],
    at: instantAt('2026-11-10T08:00:00Z'),
  })
}

const learningCardAtStrayStep = (): HeldCard => {
  const card = MemoryCard.restore({
    state: 'learning',
    step: 9,
    stability: 2.3,
    difficulty: 5,
    lastReviewAt: instantAt('2026-11-10T09:00:00Z'),
    lastRating: 'good',
    enteredAt: instantAt('2026-11-10T08:30:00Z'),
    retainedAt: null,
  })
  assert(card.ok)
  return { wordId: 'lesson-1-1', card: card.value }
}

const readingWith = (cards: ReadonlyArray<HeldCard>): TownReading => ({
  town: foundedTown(),
  at: instantAt('2026-11-10T10:00:00Z'),
  lessonSlot: idleLessonSlot,
  cards,
  bandStarts: [],
  placementScores: [],
  guidanceDismissedAt: undefined,
  seenTips: [],
  scaffold: 'es',
  scaffoldVersion: 1,
})

describe('schoolOverviewOf', () => {
  it('passes up the refusal of the next instant a card in learning is due', () => {
    const strayStepReading = readingWith([learningCardAtStrayStep()])

    const overview = schoolOverviewOf(
      strayStepReading,
      townCatalog,
      lessons,
      [],
      defaultMemoryTerms,
    )

    expect(overview).toEqual({
      ok: false,
      error: { kind: 'UnknownMemoryStep', state: 'learning', step: 9 },
    })
  })
})
