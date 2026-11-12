import type { ResourceKind } from './ResourceKind'
import type { Stores } from './Stores'
import type { Store } from './storeAfterSegment'
import type { Town } from './Town'

export const storedStoresOf = (town: Town, capacity: number): Stores => {
  const storeOf = (resource: ResourceKind): Store => ({
    amount: town.stocks[resource],
    fullSince:
      town.stocks[resource] >= capacity ? (town.fullSince[resource] ?? town.storedAt) : null,
  })
  return {
    money: storeOf('money'),
    food: storeOf('food'),
    power: storeOf('power'),
    material: storeOf('material'),
  }
}
