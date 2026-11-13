import { assert, describe, expect, it } from 'vitest'
import type { PlacementWord } from '../placement/PlacementWord'
import type { RandomSource } from '../ports/RandomSource'
import { firstItemsRandom } from '../testing/firstItemsRandom'
import {
  ana,
  bandOneStart,
  bandOneWords,
  heldOutOfStudied,
  practisedOfStudied,
  studiedCards,
  studiedLesson,
  unstudiedLesson,
  weeksAfterStart,
} from '../testing/holdoutFixtures'
import { inMemoryBandStarts } from '../testing/inMemoryBandStarts'
import { inMemoryCards, type OwnedCard } from '../testing/inMemoryCards'
import { inMemoryLessons } from '../testing/inMemoryLessons'
import { inMemoryPlacementWords } from '../testing/placementWords'
import type { Instant } from '../time/Instant'
import { beginHoldoutCheck } from './beginHoldoutCheck'
import type { HoldoutCheck, HoldoutCheckWeek } from './HoldoutCheck'

type BeginShape = {
  readonly now?: Instant
  readonly week?: HoldoutCheckWeek
  readonly checks?: ReadonlyArray<HoldoutCheck>
  readonly random?: RandomSource
  readonly cards?: ReadonlyArray<OwnedCard>
  readonly words?: ReadonlyArray<PlacementWord>
}

const begin = async ({
  now = weeksAfterStart(8),
  week = 8,
  checks = [],
  random = firstItemsRandom,
  cards = studiedCards,
  words = bandOneWords,
}: BeginShape) => {
  const bandStarts = inMemoryBandStarts([{ playerId: ana, start: bandOneStart(checks) }])
  const begun = await beginHoldoutCheck(
    { playerId: ana, scaffold: 'es', band: 1, week },
    {
      bandStarts,
      cards: inMemoryCards(cards),
      lessons: inMemoryLessons([studiedLesson, unstudiedLesson], []),
      words: inMemoryPlacementWords([{ band: 1, words }]),
      random,
      clock: { now: () => now },
    },
  )
  const stored = await bandStarts.bandStartsOf(ana)
  assert(stored.ok)
  return { begun, check: stored.value[0]?.checks.find((check) => check.week === week) }
}

const idsOf = (words: ReadonlyArray<{ readonly id: string }>): ReadonlyArray<string> =>
  words.map(({ id }) => id)

describe('beginHoldoutCheck', () => {
  it('holds the held-out words of studied lessons', async () => {
    const { check } = await begin({})
    assert(check?.kind === 'begun')
    expect(check.sample.heldOutWordIds).toEqual(idsOf(heldOutOfStudied))
  })

  it('holds as many practised words as held-out ones', async () => {
    const { check } = await begin({})
    assert(check?.kind === 'begun')
    const practised = check.sample.wordIds.filter(
      (wordId) => !check.sample.heldOutWordIds.includes(wordId),
    )
    expect(practised).toEqual(idsOf(practisedOfStudied).slice(0, 2))
  })

  it('asks every practised word when fewer are held than held out', async () => {
    const { check } = await begin({ cards: studiedCards.slice(0, 1) })
    assert(check?.kind === 'begun')
    const practised = check.sample.wordIds.filter(
      (wordId) => !check.sample.heldOutWordIds.includes(wordId),
    )
    expect(practised).toEqual(idsOf(practisedOfStudied).slice(0, 1))
  })

  it('never asks a word a chrome lesson teaches', async () => {
    const [chromeWord, ...others] = bandOneWords
    assert(chromeWord !== undefined)
    const { check } = await begin({ words: [{ ...chromeWord, isChrome: true }, ...others] })
    assert(check?.kind === 'begun')
    expect(check.sample.wordIds).not.toContain(chromeWord.id)
    expect(check.sample.heldOutWordIds).toEqual(idsOf(heldOutOfStudied).slice(1))
  })

  it('asks the sample in the order the random source draws', async () => {
    const reversed: RandomSource = {
      sampleOf: (items, count) => [...items].reverse().slice(0, count),
    }
    const { begun, check } = await begin({ random: reversed })
    assert(begun.ok && begun.value.kind === 'asking' && check?.kind === 'begun')
    expect(begun.value.items.map(({ wordId }) => wordId)).toEqual(check.sample.wordIds)
    expect(check.sample.wordIds[0]).toBe(practisedOfStudied[1]?.id)
  })

  it('keeps the sample of a check already begun', async () => {
    const sample = { wordIds: [heldOutOfStudied[0]?.id ?? ''], heldOutWordIds: [] }
    const begunBefore: HoldoutCheck = {
      kind: 'begun',
      week: 8,
      begunAt: weeksAfterStart(8),
      sample,
    }
    const { check } = await begin({ now: weeksAfterStart(9), checks: [begunBefore] })
    expect(check).toEqual(begunBefore)
  })

  it('refuses a check not due yet', async () => {
    const { begun, check } = await begin({ now: weeksAfterStart(8, -1) })
    expect(begun).toEqual({ ok: false, error: { kind: 'HoldoutCheckNotDue', band: 1, week: 8 } })
    expect(check).toBeUndefined()
  })
})
