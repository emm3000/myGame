import type { Hires } from './Hires'
import { headsOf } from './headsOf'
import { hireKinds } from './hireKinds'
import type { ResourceKind } from './ResourceKind'
import { resourceKinds } from './resourceKinds'
import type { Stocks } from './Stocks'
import type { Terrain } from './Terrain'
import type { TownCatalog } from './TownCatalog'
import type { ProductionPercent } from './TownSettings'

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
  const carry = hireKinds.reduce(
    (total, hire) => total + team[hire] * catalog.hireTermsOf(hire).carry,
    0,
  )
  const carryShare = Math.floor(carry / paidCount)
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
