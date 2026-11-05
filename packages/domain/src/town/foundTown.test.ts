import { assert, describe, expect, it } from 'vitest'
import type { Clock } from '../ports/Clock'
import { inMemoryEarnedSkills } from '../testing/inMemoryEarnedSkills'
import { inMemoryTowns } from '../testing/inMemoryTowns'
import { sequentialIds } from '../testing/sequentialIds'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { Instant } from '../time/Instant'
import { accrueTown } from './accrueTown'
import { noStoreFull } from './FullSince'
import { foundTown } from './foundTown'
import { Town } from './Town'
import { TownAddress } from './TownAddress'
import { TownName } from './TownName'
import type { TownSkill } from './TownSkill'

const foundingInstant = Instant.fromEpochMilliseconds(1_791_244_800_000)

const frozenClock: Clock = { now: () => foundingInstant }

const townAt = (playerId: string, area: number, site: number): Town => {
  const address = TownAddress.create(1, area, site)
  const name = TownName.create(`Town of ${playerId}`)
  assert(address.ok && name.ok)
  return Town.found({
    id: `town-of-${playerId}`,
    playerId,
    name: name.value,
    address: address.value,
    startingStocks: plainTownSettings.startingStocks,
    skills: [],
    at: foundingInstant,
  })
}

const sitesPerAreaOf = (sitesPerArea: number): ReturnType<typeof townCatalogOf> =>
  townCatalogOf({ ...plainTownSettings, sitesPerArea })

const noSkills = inMemoryEarnedSkills([])

const foodSkillAtTwentyPercent: TownSkill = {
  lessonId: 'lesson-1',
  resource: 'food',
  ratePercent: 20,
  earnedAt: Instant.fromEpochMilliseconds(1_791_200_000_000),
}

const tenHoursAfterFounding = Instant.fromEpochMilliseconds(
  foundingInstant.epochMilliseconds + 36_000_000,
)

describe('foundTown', () => {
  it("raises the new town's production by the skills the player earned before", async () => {
    const towns = inMemoryTowns([])
    const skills = inMemoryEarnedSkills([{ playerId: 'learner', skill: foodSkillAtTwentyPercent }])

    const founded = await foundTown(
      { playerId: 'learner', name: 'Maple Hill' },
      { towns, catalog: townCatalogOf(), clock: frozenClock, ids: sequentialIds('town'), skills },
    )

    assert(founded.ok)
    const accrual = accrueTown(founded.value, townCatalogOf(), tenHoursAfterFounding)
    assert(accrual.ok)
    expect(accrual.value.stocks.food).toBe(300 + 60)
  })

  it("starts a town with homes and the school at level 1 and the content's stocks", async () => {
    const towns = inMemoryTowns([])

    const founded = await foundTown(
      { playerId: 'newcomer', name: '  Maple Hill ' },
      {
        towns,
        catalog: townCatalogOf(),
        clock: frozenClock,
        ids: sequentialIds('town'),
        skills: noSkills,
      },
    )

    assert(founded.ok)
    expect(towns.storedTownOf('newcomer')).toMatchObject({
      id: 'town-1',
      name: { value: 'Maple Hill' },
      stocks: { money: 400, food: 300, power: 200, material: 500 },
      storedAt: foundingInstant,
      fullSince: noStoreFull,
      buildingLevels: {
        homes: 1,
        farm: 0,
        factory: 0,
        powerStation: 0,
        storage: 0,
        school: 1,
        office: 0,
      },
    })
  })

  it('founds at the lowest free site of region 1', async () => {
    const towns = inMemoryTowns([townAt('ana', 1, 1), townAt('bruno', 1, 2), townAt('carla', 2, 1)])

    const founded = await foundTown(
      { playerId: 'newcomer', name: 'Maple Hill' },
      {
        towns,
        catalog: sitesPerAreaOf(2),
        clock: frozenClock,
        ids: sequentialIds('town'),
        skills: noSkills,
      },
    )

    assert(founded.ok)
    expect(founded.value.address).toEqual({ region: 1, area: 2, site: 2 })
  })

  it('refuses a second town with PlayerAlreadyHoldsTown', async () => {
    const towns = inMemoryTowns([townAt('ana', 1, 1)])

    const founded = await foundTown(
      { playerId: 'ana', name: 'Second Town' },
      {
        towns,
        catalog: townCatalogOf(),
        clock: frozenClock,
        ids: sequentialIds('town'),
        skills: noSkills,
      },
    )

    expect(founded).toEqual({
      ok: false,
      error: { kind: 'PlayerAlreadyHoldsTown', playerId: 'ana' },
    })
  })

  it('refuses a blank name with BlankTownName', async () => {
    const founded = await foundTown(
      { playerId: 'newcomer', name: '   ' },
      {
        towns: inMemoryTowns([]),
        catalog: townCatalogOf(),
        clock: frozenClock,
        ids: sequentialIds('town'),
        skills: noSkills,
      },
    )

    expect(founded).toEqual({ ok: false, error: { kind: 'BlankTownName' } })
  })

  it('answers SiteTaken when a rival takes the site between the read and the save', async () => {
    const towns = inMemoryTowns([])
    const racingTowns = { ...towns, occupiedSites: async () => [] }
    await towns.save(townAt('ana', 1, 1))

    const founded = await foundTown(
      { playerId: 'newcomer', name: 'Maple Hill' },
      {
        towns: racingTowns,
        catalog: townCatalogOf(),
        clock: frozenClock,
        ids: sequentialIds('town'),
        skills: noSkills,
      },
    )

    expect(founded).toEqual({
      ok: false,
      error: { kind: 'SiteTaken', site: { region: 1, area: 1, site: 1 } },
    })
  })
})
