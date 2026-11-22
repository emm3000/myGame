import { assert, describe, expect, it } from 'vitest'
import type { Clock } from '#platform/domain/Clock'
import { inMemoryUnitOfWork } from '#platform/testing/inMemoryUnitOfWork'
import { sequentialIds } from '#platform/testing/sequentialIds'
import { Instant } from '#time/Instant'
import type { EarnedSkillRepository } from '../domain/EarnedSkillRepository'
import { Town } from '../domain/Town'
import { TownAddress } from '../domain/TownAddress'
import type { TownCatalog } from '../domain/TownCatalog'
import { TownName } from '../domain/TownName'
import type { TownRepository } from '../domain/TownRepository'
import type { TownSkill } from '../domain/TownSkill'
import { accrueTown } from '../resources/accrueTown'
import { noStoreFull } from '../resources/FullSince'
import { inMemoryEarnedSkills } from '../testing/inMemoryEarnedSkills'
import { inMemoryTownStores } from '../testing/inMemoryTownStores'
import { inMemoryTowns } from '../testing/inMemoryTowns'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { FoundTown } from './FoundTown'

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

const foundingIn = (
  towns: TownRepository,
  earnedSkills: EarnedSkillRepository,
  townCatalog: TownCatalog,
): FoundTown =>
  new FoundTown({
    unitOfWork: inMemoryUnitOfWork(inMemoryTownStores({ towns, earnedSkills })),
    townCatalog,
    clock: frozenClock,
    ids: sequentialIds('town'),
  })

const foodSkillAtTwentyPercent: TownSkill = {
  lessonId: 'lesson-1',
  resource: 'food',
  ratePercent: 20,
  earnedAt: Instant.fromEpochMilliseconds(1_791_200_000_000),
}

const tenHoursAfterFounding = Instant.fromEpochMilliseconds(
  foundingInstant.epochMilliseconds + 36_000_000,
)

describe('FoundTown', () => {
  it("raises the new town's production by the skills the player earned before", async () => {
    const skills = inMemoryEarnedSkills([{ playerId: 'learner', skill: foodSkillAtTwentyPercent }])
    const towns = inMemoryTowns([], skills)

    const founded = await foundingIn(towns, skills, townCatalogOf()).execute({
      playerId: 'learner',
      name: 'Maple Hill',
    })

    assert(founded.ok)
    const accrual = accrueTown(founded.value.town, townCatalogOf(), tenHoursAfterFounding)
    assert(accrual.ok)
    expect(accrual.value.stocks.food).toBe(300 + 60)
  })

  it("starts a town with homes and the school at level 1 and the content's stocks", async () => {
    const towns = inMemoryTowns([], noSkills)

    const founded = await foundingIn(towns, noSkills, townCatalogOf()).execute({
      playerId: 'newcomer',
      name: '  Maple Hill ',
    })

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
    const towns = inMemoryTowns(
      [townAt('ana', 1, 1), townAt('bruno', 1, 2), townAt('carla', 2, 1)],
      noSkills,
    )

    const founded = await foundingIn(towns, noSkills, sitesPerAreaOf(2)).execute({
      playerId: 'newcomer',
      name: 'Maple Hill',
    })

    assert(founded.ok)
    expect(founded.value.town.address).toEqual({ region: 1, area: 2, site: 2 })
  })

  it('refuses a second town with PlayerAlreadyHoldsTown', async () => {
    const towns = inMemoryTowns([townAt('ana', 1, 1)], noSkills)

    const founded = await foundingIn(towns, noSkills, townCatalogOf()).execute({
      playerId: 'ana',
      name: 'Second Town',
    })

    expect(founded).toEqual({
      ok: false,
      error: { kind: 'PlayerAlreadyHoldsTown', playerId: 'ana' },
    })
  })

  it('refuses a blank name with BlankTownName', async () => {
    const founded = await foundingIn(
      inMemoryTowns([], noSkills),
      noSkills,
      townCatalogOf(),
    ).execute({ playerId: 'newcomer', name: '   ' })

    expect(founded).toEqual({ ok: false, error: { kind: 'BlankTownName' } })
  })

  it('answers SiteTaken when a rival takes the site between the read and the save', async () => {
    const towns = inMemoryTowns([], noSkills)
    const racingTowns = { ...towns, occupiedSites: async () => [] }
    await towns.save(townAt('ana', 1, 1))

    const founded = await foundingIn(racingTowns, noSkills, townCatalogOf()).execute({
      playerId: 'newcomer',
      name: 'Maple Hill',
    })

    expect(founded).toEqual({
      ok: false,
      error: { kind: 'SiteTaken', site: { region: 1, area: 1, site: 1 } },
    })
  })
})
