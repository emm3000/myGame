import type { FullSince } from './FullSince'
import type { ResourceKind } from './ResourceKind'
import type { Store } from './storeAfterSegment'

export type Stores = Readonly<Record<ResourceKind, Store>>

export const fullSinceOf = (stores: Stores): FullSince => ({
  money: stores.money.fullSince,
  food: stores.food.fullSince,
  power: stores.power.fullSince,
  material: stores.material.fullSince,
})
