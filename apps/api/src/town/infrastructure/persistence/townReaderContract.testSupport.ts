import {
  type Accounts,
  type GuidanceDismissals,
  Instant,
  idleLessonSlot,
  type LessonSlot,
  type LessonSlotRepository,
  type PlacementScore,
  type SeenTips,
  Town,
  TownAddress,
  TownName,
  type TownReader,
  type TownRepository,
} from '@mygame/domain'
import { assert, describe, expect, it } from 'vitest'

export type TownReaderArrangement = {
  readonly reader: TownReader
  readonly accounts: Accounts
  readonly towns: TownRepository
  readonly lessonSlots: LessonSlotRepository
  readonly recordPlacementScores: (
    playerId: string,
    scores: ReadonlyArray<PlacementScore>,
  ) => Promise<void>
  readonly guidanceDismissals: GuidanceDismissals
  readonly seenTips: SeenTips
  readonly registerPlayers: (playerIds: ReadonlyArray<string>) => Promise<void>
}

const ana = '00000000-0000-4000-8000-000000000001'

const instantAt = (iso: string): Instant => Instant.fromEpochMilliseconds(Date.parse(iso))

const anasTown = (): Town => {
  const address = TownAddress.create(1, 1, 1)
  const name = TownName.create('Maple Falls')
  assert(address.ok && name.ok)
  return Town.found({
    id: '00000000-0000-4000-8000-00000000000a',
    playerId: ana,
    name: name.value,
    address: address.value,
    startingStocks: { money: 400, food: 300, power: 200, material: 500 },
    skills: [],
    at: instantAt('2026-11-10T08:00:00Z'),
  })
}

const lessonOneUnderStudy: LessonSlot = {
  kind: 'busy',
  lessonId: 'lesson-1',
  startedAt: instantAt('2026-11-10T08:55:00Z'),
  finishesAt: instantAt('2026-11-10T09:00:00Z'),
}

const scoresOutOfBandOrder: ReadonlyArray<PlacementScore> = [
  { band: 2, score: 3, takenAt: instantAt('2026-11-10T08:20:00Z') },
  { band: 1, score: 9, takenAt: instantAt('2026-11-10T08:15:00Z') },
]

export const townReaderContract = (
  adapterName: string,
  arrange: () => Promise<TownReaderArrangement>,
): void => {
  describe(`${adapterName} as a TownReader`, () => {
    it('answers no town for a player who holds none', async () => {
      const { reader, registerPlayers } = await arrange()
      await registerPlayers([ana])

      expect(await reader.townWithSchoolOf(ana)).toEqual({ ok: true, value: undefined })
    })

    it('reads the saved town with the lesson slot saved for it', async () => {
      const { reader, towns, lessonSlots, registerPlayers } = await arrange()
      await registerPlayers([ana])
      const town = anasTown()
      assert((await towns.save(town)).ok)
      assert((await lessonSlots.save(town.id, lessonOneUnderStudy)).ok)

      const read = await reader.townWithSchoolOf(ana)

      assert(read.ok && read.value !== undefined)
      expect([read.value.town.id, read.value.lessonSlot]).toEqual([town.id, lessonOneUnderStudy])
    })

    it('reads an idle school, no card and no band start for a town just founded', async () => {
      const { reader, towns, registerPlayers } = await arrange()
      await registerPlayers([ana])
      assert((await towns.save(anasTown())).ok)

      const read = await reader.townWithSchoolOf(ana)

      assert(read.ok && read.value !== undefined)
      expect([read.value.lessonSlot, read.value.cards, read.value.bandStarts]).toEqual([
        idleLessonSlot,
        [],
        [],
      ])
    })
    it('reads with the town the scaffold the player holds and its version', async () => {
      const { reader, accounts, towns, registerPlayers } = await arrange()
      await registerPlayers([ana])
      assert((await towns.save(anasTown())).ok)
      const stored = await accounts.storeScaffold(ana, 'none')

      const read = await reader.townWithSchoolOf(ana)

      assert(read.ok && read.value !== undefined)
      expect([read.value.scaffold, read.value.scaffoldVersion]).toEqual([
        'none',
        stored.scaffoldVersion,
      ])
    })

    it("reads the player's placement scores in band order", async () => {
      const { reader, towns, recordPlacementScores, registerPlayers } = await arrange()
      await registerPlayers([ana])
      assert((await towns.save(anasTown())).ok)
      await recordPlacementScores(ana, scoresOutOfBandOrder)

      const read = await reader.townWithSchoolOf(ana)

      assert(read.ok && read.value !== undefined)
      expect(read.value.placementScores.map(({ band }) => band)).toEqual([1, 2])
    })

    it('reads the instant the player dismissed the guidance', async () => {
      const { reader, towns, guidanceDismissals, registerPlayers } = await arrange()
      await registerPlayers([ana])
      assert((await towns.save(anasTown())).ok)
      const dismissedAt = instantAt('2026-11-10T08:30:00Z')
      assert((await guidanceDismissals.dismiss(ana, dismissedAt)).ok)

      const read = await reader.townWithSchoolOf(ana)

      expect(read.ok && read.value?.guidanceDismissedAt).toEqual(dismissedAt)
    })

    it('reads the tips the player has seen', async () => {
      const { reader, towns, seenTips, registerPlayers } = await arrange()
      await registerPlayers([ana])
      assert((await towns.save(anasTown())).ok)
      await seenTips.markSeen(ana, 'jobs')

      const read = await reader.townWithSchoolOf(ana)

      expect(read.ok && read.value?.seenTips).toEqual(['jobs'])
    })
  })
}
