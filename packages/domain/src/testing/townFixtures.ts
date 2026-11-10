import { assert } from 'vitest'
import type { Instant } from '../time/Instant'
import type { BuildingLevels } from '../town/BuildingLevels'
import { foundingLevels } from '../town/BuildingLevels'
import { idleWorkSlot, type WaitingList, type WorkSlot } from '../town/BuildingWork'
import { noStoreFull } from '../town/FullSince'
import { type Hires, noHires } from '../town/Hires'
import { type HiringSlot, idleHiringSlot } from '../town/HiringOrder'
import type { Stocks } from '../town/Stocks'
import { type StoredTown, Town } from '../town/Town'
import { TownAddress } from '../town/TownAddress'
import { TownName } from '../town/TownName'
import type { TownSkill } from '../town/TownSkill'

export type TownShape = {
  readonly area?: number
  readonly stocks?: Stocks
  readonly storedAt: Instant
  readonly buildingLevels?: Partial<BuildingLevels>
  readonly workSlot?: WorkSlot
  readonly waitingList?: WaitingList
  readonly skills?: ReadonlyArray<TownSkill>
  readonly hires?: Hires
  readonly hiringSlot?: HiringSlot
}

export const storedTownOf = ({
  area = 1,
  stocks = { money: 0, food: 0, power: 0, material: 0 },
  storedAt,
  buildingLevels = {},
  workSlot = idleWorkSlot,
  waitingList = [],
  skills = [],
  hires = noHires,
  hiringSlot = idleHiringSlot,
}: TownShape): StoredTown => {
  const address = TownAddress.create(1, area, 1)
  const name = TownName.create('Maple Hill')
  assert(address.ok && name.ok)
  return {
    id: 'town-1',
    playerId: 'player-1',
    name: name.value,
    address: address.value,
    stocks,
    storedAt,
    fullSince: noStoreFull,
    buildingLevels: { ...foundingLevels, ...buildingLevels },
    workSlot,
    waitingList,
    skills,
    hires,
    hiringSlot,
  }
}

export const townOf = (shape: TownShape): Town => {
  const town = Town.restore(storedTownOf(shape))
  assert(town.ok)
  return town.value
}
