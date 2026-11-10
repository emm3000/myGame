import { assert, describe, expect, it } from 'vitest'
import { townCatalogOf } from '../testing/townCatalogOf'
import type { BuildingLevels } from './BuildingLevels'
import { derivePeople } from './derivePeople'
import { noHires } from './Hires'

const noBuilding: BuildingLevels = {
  homes: 0,
  farm: 0,
  factory: 0,
  powerStation: 0,
  storage: 0,
  school: 0,
  office: 0,
}

describe('derivePeople', () => {
  it("derives supplied people from the base count and the homes' level", () => {
    const people = derivePeople({ ...noBuilding, homes: 2 }, noHires, townCatalogOf())

    assert(people.ok)
    expect(people.value.supplied).toBe(50)
  })

  it("occupies people by every building's level", () => {
    const busyLevels: BuildingLevels = {
      homes: 1,
      farm: 2,
      factory: 1,
      powerStation: 1,
      storage: 2,
      school: 1,
      office: 1,
    }

    const people = derivePeople(busyLevels, noHires, townCatalogOf())

    assert(people.ok)
    expect(people.value).toEqual({ supplied: 30, occupied: 20, free: 10 })
  })

  it('occupies people with every hire', () => {
    const people = derivePeople(
      { ...noBuilding, homes: 1 },
      { worker: 3, truck: 2 },
      townCatalogOf(),
    )

    assert(people.ok)
    expect(people.value).toEqual({ supplied: 30, occupied: 7, free: 23 })
  })

  it('answers UnknownTownBuildingLevel for a level the content lacks', () => {
    const people = derivePeople({ ...noBuilding, office: 7 }, noHires, townCatalogOf())

    expect(people).toEqual({
      ok: false,
      error: { kind: 'UnknownTownBuildingLevel', building: 'office', level: 7 },
    })
  })
})
