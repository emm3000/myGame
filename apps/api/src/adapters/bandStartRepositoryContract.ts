import {
  type BandStart,
  type BandStartRepository,
  type HoldoutCheck,
  Instant,
  type PlayerId,
} from '@mygame/domain'
import { describe, expect, it } from 'vitest'

export type BandStartRepositoryFixture = {
  readonly starts: BandStartRepository
  readonly registerPlayers: (playerIds: ReadonlyArray<PlayerId>) => Promise<void>
}

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

const bandOneStart: BandStart = {
  band: 1,
  startedAt: Instant.fromEpochMilliseconds(Date.parse('2026-11-23T09:10:00Z')),
  heldOutWords: ['know', 'make', 'say'],
  checks: [],
}

const bandTwoStart: BandStart = {
  band: 2,
  startedAt: Instant.fromEpochMilliseconds(Date.parse('2027-03-01T09:10:00Z')),
  heldOutWords: ['advice'],
  checks: [],
}

const begunAt = Instant.fromEpochMilliseconds(Date.parse('2027-01-18T09:10:00Z'))

const begunCheck: HoldoutCheck = {
  kind: 'begun',
  week: 8,
  begunAt,
  sample: { wordIds: ['word-say', 'word-time', 'word-know'], heldOutWordIds: ['word-know'] },
}

const takenCheck: HoldoutCheck = {
  ...begunCheck,
  kind: 'taken',
  heldOutScore: 1,
  practisedScore: 0,
  takenAt: Instant.fromEpochMilliseconds(Date.parse('2027-01-18T09:20:00Z')),
}

const skippedCheck: HoldoutCheck = {
  kind: 'skipped',
  week: 8,
  skippedAt: Instant.fromEpochMilliseconds(Date.parse('2027-01-18T09:30:00Z')),
}

export const bandStartRepositoryContract = (
  adapterName: string,
  arrange: () => Promise<BandStartRepositoryFixture>,
): void => {
  describe(`${adapterName} as a BandStartRepository`, () => {
    it('answers no start for a player who started no band', async () => {
      const { starts, registerPlayers } = await arrange()
      await registerPlayers([ana])

      expect(await starts.bandStartsOf(ana)).toEqual({ ok: true, value: [] })
    })

    it('reads back each band with its instant and its held-out words, in band order', async () => {
      const { starts, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await starts.save(ana, bandTwoStart)
      await starts.save(ana, bandOneStart)

      expect(await starts.bandStartsOf(ana)).toEqual({
        ok: true,
        value: [bandOneStart, bandTwoStart],
      })
    })

    it('reads back a start that drew no word', async () => {
      const { starts, registerPlayers } = await arrange()
      await registerPlayers([ana])
      const emptyDraw = { ...bandOneStart, heldOutWords: [] }

      await starts.save(ana, emptyDraw)

      expect(await starts.bandStartsOf(ana)).toEqual({ ok: true, value: [emptyDraw] })
    })

    it('keeps the first draw of a band saved twice', async () => {
      const { starts, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await starts.save(ana, bandOneStart)

      await starts.save(ana, {
        ...bandOneStart,
        startedAt: bandTwoStart.startedAt,
        heldOutWords: ['time'],
      })

      expect(await starts.bandStartsOf(ana)).toEqual({ ok: true, value: [bandOneStart] })
    })

    it('keeps the starts of one player from another', async () => {
      const { starts, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])

      await starts.save(ana, bandOneStart)

      expect(await starts.bandStartsOf(bruno)).toEqual({ ok: true, value: [] })
    })

    it('lets two players hold the same word out', async () => {
      const { starts, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])

      await starts.save(ana, bandOneStart)
      await starts.save(bruno, bandOneStart)

      expect(await starts.bandStartsOf(bruno)).toEqual({ ok: true, value: [bandOneStart] })
    })
    it('reads back a begun check with its sample in the order it asks', async () => {
      const { starts, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await starts.save(ana, bandOneStart)

      await starts.saveCheck(ana, 1, begunCheck)

      expect(await starts.bandStartsOf(ana)).toEqual({
        ok: true,
        value: [{ ...bandOneStart, checks: [begunCheck] }],
      })
    })

    it('replaces a begun check with its result', async () => {
      const { starts, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await starts.save(ana, bandOneStart)
      await starts.saveCheck(ana, 1, begunCheck)

      await starts.saveCheck(ana, 1, takenCheck)

      expect(await starts.bandStartsOf(ana)).toEqual({
        ok: true,
        value: [{ ...bandOneStart, checks: [takenCheck] }],
      })
    })

    it('drops the sample of a check skipped after it was begun', async () => {
      const { starts, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await starts.save(ana, bandOneStart)
      await starts.saveCheck(ana, 1, begunCheck)

      await starts.saveCheck(ana, 1, skippedCheck)

      expect(await starts.bandStartsOf(ana)).toEqual({
        ok: true,
        value: [{ ...bandOneStart, checks: [skippedCheck] }],
      })
    })

    it('keeps each band’s checks to its own start, in week order', async () => {
      const { starts, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await starts.save(ana, bandOneStart)
      await starts.save(ana, bandTwoStart)
      const releasing: HoldoutCheck = { ...skippedCheck, week: 24 }

      await starts.saveCheck(ana, 1, releasing)
      await starts.saveCheck(ana, 1, takenCheck)

      expect(await starts.bandStartsOf(ana)).toEqual({
        ok: true,
        value: [{ ...bandOneStart, checks: [takenCheck, releasing] }, bandTwoStart],
      })
    })
  })
}
