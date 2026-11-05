import { assert, describe, expect, it } from 'vitest'
import { townCatalogOf } from '../testing/townCatalogOf'
import type { BuildingLevels } from './BuildingLevels'
import { townLabelOf } from './townLabelOf'

const levelsWithHomesAt = (homes: number): BuildingLevels => ({
  homes,
  farm: 0,
  factory: 0,
  powerStation: 0,
  storage: 0,
  school: 1,
  office: 0,
})

describe('townLabelOf', () => {
  it("labels the town a city once its supplied people reach the content's count", () => {
    const labels = [1, 2].map((homes) => townLabelOf(levelsWithHomesAt(homes), townCatalogOf()))

    expect(labels).toEqual([
      { ok: true, value: 'town' },
      { ok: true, value: 'city' },
    ])
  })

  it('keeps the town label one person short of the count', () => {
    const catalog = townCatalogOf()
    const label = townLabelOf(
      levelsWithHomesAt(2),
      townCatalogOf({ ...catalog.townSettings(), cityPeople: 51 }),
    )

    assert(label.ok)
    expect(label.value).toBe('town')
  })
})
