import type { Hires } from '../hiring/Hires'
import type { TownCatalog } from '../ports/TownCatalog'
import type { ResourceKind } from '../resources/ResourceKind'
import { resourceKinds } from '../resources/resourceKinds'
import type { Stocks } from '../resources/Stocks'
import type { ProductionPercent } from '../TownSettings'
import { carryOf } from './carryOf'
import { headsOf } from './headsOf'
import type { Terrain } from './Terrain'

const MILLISECONDS_PER_HOUR_IN_PERCENT = 360_000_000

export const jobPayOfMilliseconds = (
  terrain: Terrain,
  team: Hires,
  workedMilliseconds: number,
  catalog: TownCatalog,
  payPercent: ProductionPercent,
): Stocks => {
  const payPerHour = { ...catalog.townSettings().job.payPerHour[terrain], money: 0 }
  const paidCount = resourceKinds.filter((resource) => payPerHour[resource] > 0).length
  const heads = headsOf(team)
  const carryShare = Math.floor(carryOf(team, catalog) / paidCount)
  const payOf = (resource: ResourceKind): number =>
    payPerHour[resource] > 0
      ? Math.min(
          Math.floor(
            (heads * payPerHour[resource] * workedMilliseconds * payPercent[resource]) /
              MILLISECONDS_PER_HOUR_IN_PERCENT,
          ),
          carryShare,
        )
      : 0
  return {
    money: payOf('money'),
    food: payOf('food'),
    power: payOf('power'),
    material: payOf('material'),
  }
}
