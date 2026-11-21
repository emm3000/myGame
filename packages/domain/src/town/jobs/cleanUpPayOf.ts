import type { Hires } from '../hiring/Hires'
import type { TownCatalog } from '../ports/TownCatalog'
import type { Stocks } from '../Stocks'
import { carryOf } from './carryOf'

const PAID_RESOURCES = 2

export const cleanUpPayOf = (waste: number, team: Hires, catalog: TownCatalog): Stocks => {
  const { moneyPerPoint, materialPerPoint } = catalog.townSettings().waste
  const carryShare = Math.floor(carryOf(team, catalog) / PAID_RESOURCES)
  return {
    money: Math.min(moneyPerPoint * waste, carryShare),
    food: 0,
    power: 0,
    material: Math.min(materialPerPoint * waste, carryShare),
  }
}
