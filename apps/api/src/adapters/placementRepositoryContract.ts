import {
  Instant,
  type PlacementRepository,
  type PlayerId,
  type SkippedPlacement,
  type TakenPlacement,
} from '@mygame/domain'
import { describe, expect, it } from 'vitest'

export type PlacementRepositoryFixture = {
  readonly placements: PlacementRepository
  readonly registerPlayers: (playerIds: ReadonlyArray<PlayerId>) => Promise<void>
}

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

const begunAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:00:00Z'))
const bandOneTakenAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:10:00Z'))
const bandTwoTakenAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-12T09:20:00Z'))

const begun: TakenPlacement = {
  kind: 'taken',
  begunAt,
  samples: [
    { band: 1, wordIds: ['word-90', 'word-17', 'word-44'] },
    { band: 2, wordIds: ['word-301', 'word-205'] },
  ],
  scores: [],
}

const skipped: SkippedPlacement = { kind: 'skipped', skippedAt: begunAt }

const bandOneScore = { band: 1, score: 29, takenAt: bandOneTakenAt }

const bandTwoScore = { band: 2, score: 12, takenAt: bandTwoTakenAt }

export const placementRepositoryContract = (
  adapterName: string,
  arrange: () => Promise<PlacementRepositoryFixture>,
): void => {
  describe(`${adapterName} as a PlacementRepository`, () => {
    it('answers no placement for a player who took or skipped none', async () => {
      const { placements, registerPlayers } = await arrange()
      await registerPlayers([ana])

      expect(await placements.placementOf(ana)).toEqual({ ok: true, value: undefined })
    })

    it('reads back a skip with its instant', async () => {
      const { placements, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await placements.save(ana, skipped)

      expect(await placements.placementOf(ana)).toEqual({ ok: true, value: skipped })
    })

    it('reads back each band sample in band order and drawn order', async () => {
      const { placements, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await placements.save(ana, begun)

      expect(await placements.placementOf(ana)).toEqual({ ok: true, value: begun })
    })

    it('stores per band the score and the instant', async () => {
      const { placements, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await placements.save(ana, begun)

      await placements.save(ana, { ...begun, scores: [bandOneScore] })
      await placements.save(ana, { ...begun, scores: [bandOneScore, bandTwoScore] })

      expect(await placements.placementOf(ana)).toEqual({
        ok: true,
        value: { ...begun, scores: [bandOneScore, bandTwoScore] },
      })
    })

    it('keeps the first score of a band saved twice', async () => {
      const { placements, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await placements.save(ana, { ...begun, scores: [bandOneScore] })

      await placements.save(ana, {
        ...begun,
        scores: [{ band: 1, score: 3, takenAt: bandTwoTakenAt }],
      })

      expect(await placements.placementOf(ana)).toEqual({
        ok: true,
        value: { ...begun, scores: [bandOneScore] },
      })
    })

    it('keeps a skip over a placement saved after it', async () => {
      const { placements, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await placements.save(ana, skipped)

      await placements.save(ana, { ...begun, scores: [bandOneScore] })

      expect(await placements.placementOf(ana)).toEqual({ ok: true, value: skipped })
    })

    it('keeps a taken placement over a skip saved after it', async () => {
      const { placements, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await placements.save(ana, { ...begun, scores: [bandOneScore] })

      await placements.save(ana, skipped)

      expect(await placements.placementOf(ana)).toEqual({
        ok: true,
        value: { ...begun, scores: [bandOneScore] },
      })
    })

    it('keeps the first sample over a placement begun again', async () => {
      const { placements, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await placements.save(ana, begun)

      await placements.save(ana, {
        ...begun,
        begunAt: bandTwoTakenAt,
        samples: [{ band: 1, wordIds: ['word-1'] }],
      })

      expect(await placements.placementOf(ana)).toEqual({ ok: true, value: begun })
    })

    it('keeps the placement of one player from another', async () => {
      const { placements, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])

      await placements.save(ana, begun)

      expect(await placements.placementOf(bruno)).toEqual({ ok: true, value: undefined })
    })
  })
}
