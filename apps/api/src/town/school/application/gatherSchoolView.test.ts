import { join } from 'node:path'
import type { TownReading } from '@mygame/domain'
import {
  defaultMemoryTerms,
  type HeldCard,
  headwordOf,
  Instant,
  idleLessonSlot,
  MemoryCard,
  Town,
  TownAddress,
  TownName,
} from '@mygame/domain'
import { assert, describe, expect, it } from 'vitest'
import { apiPackagePath } from '#apiPackagePath.testSupport'
import { JsonTownCatalog } from '#content/infrastructure/json/JsonTownCatalog'
import { readJsonLessonLibrary } from '#content/infrastructure/json/readJsonLessonLibrary'
import { gatherSchoolView } from './gatherSchoolView'

const contentDirectory = apiPackagePath('content/')

const lessons = readJsonLessonLibrary(contentDirectory)

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

describe('gatherSchoolView', () => {
  it('passes up the refusal of the next instant a card in learning is due', () => {
    const strayStepReading = readingWith([learningCardAtStrayStep()])

    const view = gatherSchoolView(strayStepReading, townCatalog, lessons, defaultMemoryTerms)

    expect(view).toEqual({
      ok: false,
      error: { kind: 'UnknownMemoryStep', state: 'learning', step: 9 },
    })
  })

  it('shows no support for a word its band holds out', () => {
    const [firstLesson] = lessons.lessons()
    assert(firstLesson !== undefined)
    const [heldOutWord] = firstLesson.words
    assert(heldOutWord !== undefined)
    const heldOutReading: TownReading = {
      ...readingWith([]),
      bandStarts: [
        {
          band: 1,
          startedAt: instantAt('2026-11-10T08:00:00Z'),
          heldOutWords: [headwordOf(heldOutWord.acceptedForms[0])],
          checks: [],
        },
      ],
    }

    const view = gatherSchoolView(heldOutReading, townCatalog, lessons, defaultMemoryTerms)

    assert(view.ok)
    expect(view.value.lessons[0]?.words[0]).toMatchObject({
      wordId: heldOutWord.id,
      support: null,
    })
  })
})
