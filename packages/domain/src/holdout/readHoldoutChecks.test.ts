import { assert, describe, expect, it } from 'vitest'
import type { BandStart } from '../learning/BandStart'
import { inMemoryBandStarts } from '../testing/inMemoryBandStarts'
import { inMemoryPlacementWords, placementWordsOfBand } from '../testing/placementWords'
import { Instant } from '../time/Instant'
import type { HoldoutCheck } from './HoldoutCheck'
import { readHoldoutChecks } from './readHoldoutChecks'

const ana = 'player-ana'

const MILLISECONDS_PER_WEEK = 7 * 24 * 3_600_000

const bandOneStartedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:00:00Z'))

const weeksAfterStart = (weeks: number, extraMilliseconds = 0): Instant =>
  Instant.fromEpochMilliseconds(
    bandOneStartedAt.epochMilliseconds + weeks * MILLISECONDS_PER_WEEK + extraMilliseconds,
  )

const bandOneWords = placementWordsOfBand(1, 10)

const bandOneStart = (checks: ReadonlyArray<HoldoutCheck>): BandStart => ({
  band: 1,
  startedAt: bandOneStartedAt,
  heldOutWords: [bandOneWords[0]?.headword ?? 'missing'],
  checks,
})

const checksAt = async (now: Instant, checks: ReadonlyArray<HoldoutCheck> = []) => {
  const read = await readHoldoutChecks(
    { playerId: ana },
    {
      bandStarts: inMemoryBandStarts([{ playerId: ana, start: bandOneStart(checks) }]),
      words: inMemoryPlacementWords([{ band: 1, words: bandOneWords }]),
      clock: { now: () => now },
    },
  )
  assert(read.ok)
  return read.value
}

const takenEightWeekCheck: HoldoutCheck = {
  kind: 'taken',
  week: 8,
  begunAt: weeksAfterStart(8),
  sample: { wordIds: [], heldOutWordIds: [] },
  heldOutScore: 0,
  practisedScore: 0,
  takenAt: weeksAfterStart(8),
}

describe('readHoldoutChecks', () => {
  it('falls due 8 weeks after the band’s start', async () => {
    expect(await checksAt(weeksAfterStart(8, -1))).toEqual([])
    expect(await checksAt(weeksAfterStart(8))).toEqual([{ kind: 'due', band: 1, week: 8 }])
  })

  it('falls due again at 24 weeks', async () => {
    expect(await checksAt(weeksAfterStart(24, -1), [takenEightWeekCheck])).toEqual([])
    expect(await checksAt(weeksAfterStart(24), [takenEightWeekCheck])).toEqual([
      { kind: 'due', band: 1, week: 24 },
    ])
  })

  it('lets an 8-week check never taken lapse once the 24-week check falls due', async () => {
    expect(await checksAt(weeksAfterStart(24))).toEqual([{ kind: 'due', band: 1, week: 24 }])
  })

  it('is no longer due once skipped', async () => {
    const skipped: HoldoutCheck = { kind: 'skipped', week: 24, skippedAt: weeksAfterStart(25) }
    expect(await checksAt(weeksAfterStart(26), [takenEightWeekCheck, skipped])).toEqual([])
  })

  it('asks a begun check’s words in the placement’s format', async () => {
    const [heldOut, practised] = bandOneWords
    assert(heldOut !== undefined && practised !== undefined)
    const begun: HoldoutCheck = {
      kind: 'begun',
      week: 8,
      begunAt: weeksAfterStart(8),
      sample: { wordIds: [practised.id, heldOut.id], heldOutWordIds: [heldOut.id] },
    }
    const [asking] = await checksAt(weeksAfterStart(9), [begun])
    assert(asking?.kind === 'asking')
    expect(asking.items.map(({ word }) => word)).toEqual([practised.word, heldOut.word])
    expect(asking.items[0]?.choices.map(({ gloss }) => gloss).sort()).toEqual(
      [heldOut.gloss, practised.gloss].sort(),
    )
  })
})
