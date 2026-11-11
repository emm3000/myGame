import { assert } from 'vitest'
import type { Instant } from '../time/Instant'
import type { BuildingLevels } from '../town/BuildingLevels'
import { foundingLevels } from '../town/BuildingLevels'
import { idleWorkSlot, type WaitingList, type WorkSlot } from '../town/BuildingWork'
import { noStoreFull } from '../town/FullSince'
import { type Hires, noHires } from '../town/Hires'
import { type HiringSlot, idleHiringSlot } from '../town/HiringOrder'
import { idleJobSlot, type JobSlot } from '../town/Job'
import type { Stocks } from '../town/Stocks'
import { type StoredTown, Town } from '../town/Town'
import { TownAddress } from '../town/TownAddress'
import { TownName } from '../town/TownName'
import type { TownSkill } from '../town/TownSkill'

export type TownShape = {
  readonly id?: string
  readonly playerId?: string
  readonly name?: string
  readonly area?: number
  readonly site?: number
  readonly stocks?: Stocks
  readonly storedAt: Instant
  readonly buildingLevels?: Partial<BuildingLevels>
  readonly workSlot?: WorkSlot
  readonly waitingList?: WaitingList
  readonly skills?: ReadonlyArray<TownSkill>
  readonly hires?: Hires
  readonly hiringSlot?: HiringSlot
  readonly jobSlot?: JobSlot
}

export const storedTownOf = ({
  id = 'town-1',
  playerId = 'player-1',
  name: chosenName = 'Maple Hill',
  area = 1,
  site = 1,
  stocks = { money: 0, food: 0, power: 0, material: 0 },
  storedAt,
  buildingLevels = {},
  workSlot = idleWorkSlot,
  waitingList = [],
  skills = [],
  hires = noHires,
  hiringSlot = idleHiringSlot,
  jobSlot = idleJobSlot,
}: TownShape): StoredTown => {
  const address = TownAddress.create(1, area, site)
  const name = TownName.create(chosenName)
  assert(address.ok && name.ok)
  return {
    id,
    playerId,
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
    jobSlot,
  }
}

export const townOf = (shape: TownShape): Town => {
  const town = Town.restore(storedTownOf(shape))
  assert(town.ok)
  return town.value
}
