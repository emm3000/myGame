import {
  type EarnedSkillRepository,
  foundingLevels,
  type Hires,
  type HiringSlot,
  Instant,
  idleHiringSlot,
  idleJobSlot,
  idleWorkSlot,
  type Job,
  type JobSlot,
  noHires,
  noStoreFull,
  type PlayerId,
  Town,
  TownAddress,
  TownName,
  type TownRepository,
  type TownSkill,
  type WaitingList,
  type WorkSlot,
} from '@mygame/domain'
import { assert, describe, expect, it } from 'vitest'

export type TownRepositoryFixture = {
  readonly towns: TownRepository
  readonly skills: EarnedSkillRepository
  readonly registerPlayers: (playerIds: ReadonlyArray<PlayerId>) => Promise<void>
}

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

const foundedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-04T08:00:00Z'))
const grownAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-04T10:30:00Z'))
const foodFilledAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-04T09:45:00Z'))

const foodSkill: TownSkill = {
  lessonId: 'lesson-1',
  resource: 'food',
  ratePercent: 5,
  earnedAt: Instant.fromEpochMilliseconds(Date.parse('2026-11-04T09:00:00Z')),
}

const townOf = (
  id: string,
  playerId: PlayerId,
  area: number,
  site: number,
  skills: ReadonlyArray<TownSkill> = [],
): Town => {
  const address = TownAddress.create(1, area, site)
  const name = TownName.create(`Town ${id.slice(-1)}`)
  assert(address.ok && name.ok)
  return Town.found({
    id,
    playerId,
    name: name.value,
    address: address.value,
    startingStocks: { money: 400, food: 300, power: 200, material: 500 },
    skills,
    at: foundedAt,
  })
}

const anasTown = townOf('00000000-0000-4000-8000-00000000000a', ana, 1, 1)

const busyFactory: WorkSlot = {
  kind: 'busy',
  building: 'factory',
  level: 1,
  cost: { money: 60, food: 0, power: 15, material: 120 },
  startedAt: grownAt,
  finishesAt: Instant.fromEpochMilliseconds(Date.parse('2026-11-04T10:40:00Z')),
}

const waitingWork: WaitingList = [
  {
    building: 'powerStation',
    level: 1,
    cost: { money: 80, food: 0, power: 0, material: 90 },
    durationSeconds: 900,
  },
  {
    building: 'farm',
    level: 4,
    cost: { money: 140, food: 30, power: 20, material: 200 },
    durationSeconds: 1500,
  },
]

const hiredStaff: Hires = { worker: 3, truck: 1 }

const busyHiring: HiringSlot = {
  kind: 'busy',
  hire: 'truck',
  count: 2,
  costPerHire: { money: 150, food: 0, power: 10, material: 60 },
  secondsPerHire: 600,
  startedAt: grownAt,
}

const teamOnAJob: Job = {
  kind: 'out',
  site: { region: 1, area: 3, site: 9 },
  team: { worker: 2, truck: 1 },
  hours: 2,
  sentAt: grownAt,
  oneWaySeconds: 660,
  pay: { money: 0, food: 210, power: 0, material: 180 },
  payPercent: { money: 100, food: 110, power: 100, material: 90 },
}

const calledBackTeam: Job = {
  ...teamOnAJob,
  pay: { money: 0, food: 35, power: 0, material: 30 },
  calledBackAt: Instant.fromEpochMilliseconds(Date.parse('2026-11-04T11:00:00Z')),
}

type GrownTerms = {
  readonly workSlot?: WorkSlot
  readonly waitingList?: WaitingList
  readonly hires?: Hires
  readonly hiringSlot?: HiringSlot
  readonly jobSlot?: JobSlot
}

const grownTown = ({
  workSlot = idleWorkSlot,
  waitingList = [],
  hires = noHires,
  hiringSlot = idleHiringSlot,
  jobSlot = idleJobSlot,
}: GrownTerms = {}): Town => {
  const restored = Town.restore({
    id: anasTown.id,
    playerId: anasTown.playerId,
    name: anasTown.name,
    address: anasTown.address,
    stocks: { money: 912, food: 1000, power: 0, material: 47 },
    storedAt: grownAt,
    fullSince: { ...noStoreFull, food: foodFilledAt },
    buildingLevels: { ...foundingLevels, farm: 3, storage: 1, office: 2 },
    workSlot,
    waitingList,
    hires,
    hiringSlot,
    jobSlot,
    skills: [],
  })
  assert(restored.ok)
  return restored.value
}

export const townRepositoryContract = (
  adapterName: string,
  arrange: () => Promise<TownRepositoryFixture>,
): void => {
  describe(`${adapterName} as a TownRepository`, () => {
    it('reads back a founded town', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await towns.save(anasTown)

      expect(await towns.townOf(ana)).toEqual({ ok: true, value: anasTown })
    })

    it('reads back the stocks, the full stores and the levels of a later save', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await towns.save(anasTown)

      await towns.save(grownTown())

      expect(await towns.townOf(ana)).toEqual({ ok: true, value: grownTown() })
    })

    it('reads back the work slot and the waiting list with their debited costs', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await towns.save(anasTown)

      await towns.save(grownTown({ workSlot: busyFactory, waitingList: waitingWork }))

      expect(await towns.townOf(ana)).toEqual({
        ok: true,
        value: grownTown({ workSlot: busyFactory, waitingList: waitingWork }),
      })
    })

    it('reads back a waiting list a later save shortened', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await towns.save(grownTown({ workSlot: busyFactory, waitingList: waitingWork }))

      await towns.save(grownTown({ workSlot: busyFactory, waitingList: waitingWork.slice(0, 1) }))

      expect(await towns.townOf(ana)).toEqual({
        ok: true,
        value: grownTown({ workSlot: busyFactory, waitingList: waitingWork.slice(0, 1) }),
      })
    })

    it('reads back the hires and the busy hiring order with its cost per hire', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await towns.save(anasTown)

      await towns.save(grownTown({ hires: hiredStaff, hiringSlot: busyHiring }))

      expect(await towns.townOf(ana)).toEqual({
        ok: true,
        value: grownTown({ hires: hiredStaff, hiringSlot: busyHiring }),
      })
    })

    it('reads an idle hiring slot once a later save leaves the slot idle', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await towns.save(grownTown({ hires: hiredStaff, hiringSlot: busyHiring }))

      await towns.save(grownTown({ hires: { ...hiredStaff, truck: 3 } }))

      expect(await towns.townOf(ana)).toEqual({
        ok: true,
        value: grownTown({ hires: { ...hiredStaff, truck: 3 } }),
      })
    })

    it('reads back the job of a team sent out with its fixed pay and percents', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await towns.save(anasTown)

      await towns.save(grownTown({ hires: hiredStaff, jobSlot: teamOnAJob }))

      expect(await towns.townOf(ana)).toEqual({
        ok: true,
        value: grownTown({ hires: hiredStaff, jobSlot: teamOnAJob }),
      })
    })

    it('reads back a called back job with its call back instant and partial pay', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await towns.save(grownTown({ hires: hiredStaff, jobSlot: teamOnAJob }))

      await towns.save(grownTown({ hires: hiredStaff, jobSlot: calledBackTeam }))

      expect(await towns.townOf(ana)).toEqual({
        ok: true,
        value: grownTown({ hires: hiredStaff, jobSlot: calledBackTeam }),
      })
    })

    it('reads an idle job slot once a later save brings the team home', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await towns.save(grownTown({ hires: hiredStaff, jobSlot: calledBackTeam }))

      await towns.save(grownTown({ hires: hiredStaff }))

      const read = await towns.townOf(ana)
      expect(read.ok && read.value?.jobSlot).toEqual({ kind: 'idle' })
    })

    it('reads the skills its player earned on the town', async () => {
      const { towns, skills, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await towns.save(anasTown)

      await skills.save(ana, foodSkill)

      const read = await towns.townOf(ana)
      expect(read.ok && read.value?.skills).toEqual([foodSkill])
    })

    it('never stores a skill a saved town carries', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await towns.save(townOf(anasTown.id, ana, 1, 1, [foodSkill]))

      const read = await towns.townOf(ana)
      expect(read.ok && read.value?.skills).toEqual([])
    })

    it('answers no town for a player who holds none', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await towns.save(anasTown)

      expect([await towns.townOf(bruno), await towns.holdsTown(bruno)]).toEqual([
        { ok: true, value: undefined },
        false,
      ])
    })

    it('tells a player who holds a town', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await towns.save(anasTown)

      expect(await towns.holdsTown(ana)).toBe(true)
    })

    it('lists the site of every town', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await towns.save(anasTown)
      await towns.save(townOf('00000000-0000-4000-8000-00000000000b', bruno, 2, 7))

      const sites = await towns.occupiedSites()

      expect([...sites].sort((left, right) => left.area - right.area)).toEqual([
        { region: 1, area: 1, site: 1 },
        { region: 1, area: 2, site: 7 },
      ])
    })

    it('refuses a second town on a taken site with SiteTaken', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      await towns.save(anasTown)

      const saved = await towns.save(townOf('00000000-0000-4000-8000-00000000000b', bruno, 1, 1))

      expect(saved).toEqual({
        ok: false,
        error: { kind: 'SiteTaken', site: { region: 1, area: 1, site: 1 } },
      })
    })

    it('refuses a second town for one player with PlayerAlreadyHoldsTown', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await towns.save(anasTown)

      const saved = await towns.save(townOf('00000000-0000-4000-8000-00000000000b', ana, 1, 2))

      expect(saved).toEqual({
        ok: false,
        error: { kind: 'PlayerAlreadyHoldsTown', playerId: ana },
      })
    })

    it('keeps one town when two foundings race for one site', async () => {
      const { towns, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])
      const brunosTown = townOf('00000000-0000-4000-8000-00000000000b', bruno, 1, 1)

      const saves = await Promise.all([towns.save(anasTown), towns.save(brunosTown)])

      const held = [await towns.holdsTown(ana), await towns.holdsTown(bruno)]
      expect([saves.filter((saved) => saved.ok).length, held.filter(Boolean).length]).toEqual([
        1, 1,
      ])
      expect(saves.find((saved) => !saved.ok)).toEqual({
        ok: false,
        error: { kind: 'SiteTaken', site: { region: 1, area: 1, site: 1 } },
      })
    })
  })
}
