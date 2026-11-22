import { assert, describe, expect, it } from 'vitest'
import { noHires } from '../../hiring/domain/Hires'
import { townCatalogOf } from '../../testing/townCatalogOf'
import type { BuildingLevel } from './BuildingLevel'
import type { BuildingLevels } from './BuildingLevels'
import { derivePeopleForWork } from './derivePeopleForWork'

const firstHomesAndFarm: BuildingLevels = {
  homes: 1,
  farm: 1,
  factory: 0,
  powerStation: 0,
  storage: 0,
  school: 0,
  office: 0,
}

const catalog = townCatalogOf()

const nextLevelOf = (building: BuildingLevel['building'], level: number): BuildingLevel => {
  const next = catalog.levelOf(building, level)
  assert(next?.building === building)
  return next
}

describe('derivePeopleForWork', () => {
  it('needs the people the next level occupies beyond the level before it', () => {
    const people = derivePeopleForWork(firstHomesAndFarm, noHires, nextLevelOf('farm', 2), catalog)

    assert(people.ok)
    expect(people.value).toEqual({ needed: 2, freeBefore: 28, freeAfter: 26 })
  })

  it('counts the people a homes level supplies in the free people after it', () => {
    const people = derivePeopleForWork(firstHomesAndFarm, noHires, nextLevelOf('homes', 2), catalog)

    assert(people.ok)
    expect(people.value).toEqual({ needed: 0, freeBefore: 28, freeAfter: 48 })
  })

  it('needs the same people whatever the hires, which only lower the free people', () => {
    const people = derivePeopleForWork(
      firstHomesAndFarm,
      { worker: 3, truck: 2 },
      nextLevelOf('farm', 2),
      catalog,
    )

    assert(people.ok)
    expect(people.value).toEqual({ needed: 2, freeBefore: 21, freeAfter: 19 })
  })

  it('refuses a projected level the catalog does not hold', () => {
    const people = derivePeopleForWork(
      { ...firstHomesAndFarm, factory: 99 },
      noHires,
      nextLevelOf('farm', 2),
      catalog,
    )

    expect(people).toEqual({
      ok: false,
      error: { kind: 'UnknownTownBuildingLevel', building: 'factory', level: 99 },
    })
  })
})
