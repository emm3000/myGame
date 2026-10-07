import type { DomainError } from '../DomainError'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import { ok, type Result } from '../Result'
import type { ResourceKind } from '../resources/Resources'
import { resourceKinds } from '../resources/resourceKinds'
import { nextSeasonBoundaryAfter } from '../season/nextSeasonBoundaryAfter'
import { Instant } from '../time/Instant'
import { deriveResourceRates } from './deriveResourceRates'
import { deriveWarehouseCapacity } from './deriveWarehouseCapacity'
import type { Fief } from './Fief'
import { isStoreFull } from './isStoreFull'

export type FullAt = Readonly<Record<ResourceKind, Instant | null>>

type Store =
  | { readonly kind: 'filling'; readonly amount: number; readonly unchangedSegments: number }
  | { readonly kind: 'settled'; readonly fullAt: Instant | null }

const MILLISECONDS_PER_HOUR = 3_600_000

const SEGMENTS_TO_PROVE_IT_NEVER_FILLS = 5

const fillWithin = (
  amount: number,
  ratePerHour: number,
  capacityUnits: number,
  from: Instant,
  to: Instant,
): Instant | undefined => {
  if (ratePerHour === 0) {
    return undefined
  }
  const filledAt =
    from.epochMilliseconds +
    Math.ceil(((capacityUnits - amount) * MILLISECONDS_PER_HOUR) / ratePerHour)
  return filledAt <= to.epochMilliseconds ? Instant.fromEpochMilliseconds(filledAt) : undefined
}

const storeAfter = (
  amount: number,
  unchangedSegments: number,
  ratePerHour: number,
  capacityUnits: number,
  from: Instant,
  to: Instant,
): Store => {
  const filledAt = fillWithin(amount, ratePerHour, capacityUnits, from, to)
  if (filledAt !== undefined) {
    return { kind: 'settled', fullAt: filledAt }
  }
  const accruedAmount = Math.floor(
    (amount * MILLISECONDS_PER_HOUR +
      ratePerHour * (to.epochMilliseconds - from.epochMilliseconds)) /
      MILLISECONDS_PER_HOUR,
  )
  if (accruedAmount > amount) {
    return { kind: 'filling', amount: accruedAmount, unchangedSegments: 0 }
  }
  if (unchangedSegments + 1 >= SEGMENTS_TO_PROVE_IT_NEVER_FILLS) {
    return { kind: 'settled', fullAt: null }
  }
  return { kind: 'filling', amount, unchangedSegments: unchangedSegments + 1 }
}

type Stores = Record<ResourceKind, Store>

const storedStoreOf = (fief: Fief, kind: ResourceKind, capacityUnits: number): Store =>
  isStoreFull(fief.stocks, kind, capacityUnits)
    ? { kind: 'settled', fullAt: fief.fullSince[kind] ?? fief.storedAt }
    : { kind: 'filling', amount: fief.stocks[kind], unchangedSegments: 0 }

const storedStoresOf = (fief: Fief, capacityUnits: number): Stores => ({
  wood: storedStoreOf(fief, 'wood', capacityUnits),
  stone: storedStoreOf(fief, 'stone', capacityUnits),
  iron: storedStoreOf(fief, 'iron', capacityUnits),
  gold: storedStoreOf(fief, 'gold', capacityUnits),
  food: storedStoreOf(fief, 'food', capacityUnits),
})

const storesAfterSegment = (
  stores: Stores,
  rates: Readonly<Record<ResourceKind, number>>,
  capacityUnits: number,
  from: Instant,
  to: Instant,
): Stores => {
  const next = { ...stores }
  for (const kind of resourceKinds) {
    const store = stores[kind]
    if (store.kind === 'filling') {
      next[kind] = storeAfter(
        store.amount,
        store.unchangedSegments,
        rates[kind],
        capacityUnits,
        from,
        to,
      )
    }
  }
  return next
}

const isAnyFilling = (stores: Stores): boolean =>
  resourceKinds.some((kind) => stores[kind].kind === 'filling')

const settledStoresOf = (
  fief: Fief,
  catalog: BuildingCatalog,
  capacityUnits: number,
): Result<Stores, DomainError> => {
  const settings = catalog.fiefSettings()
  let stores = storedStoresOf(fief, capacityUnits)
  let segmentStart = fief.storedAt
  while (isAnyFilling(stores)) {
    const segmentEnd = nextSeasonBoundaryAfter(segmentStart, settings)
    const rates = deriveResourceRates(
      fief.buildingLevels,
      fief.artLevels,
      fief.terrain,
      catalog,
      segmentStart,
    )
    if (!rates.ok) {
      return rates
    }
    stores = storesAfterSegment(stores, rates.value, capacityUnits, segmentStart, segmentEnd)
    segmentStart = segmentEnd
  }
  return ok(stores)
}

const fullAtOf = (store: Store): Instant | null => (store.kind === 'settled' ? store.fullAt : null)

export const deriveFullAt = (fief: Fief, catalog: BuildingCatalog): Result<FullAt, DomainError> => {
  const capacityUnits = deriveWarehouseCapacity(fief.buildingLevels.warehouse, catalog)
  if (!capacityUnits.ok) {
    return capacityUnits
  }
  const stores = settledStoresOf(fief, catalog, capacityUnits.value)
  if (!stores.ok) {
    return stores
  }
  return ok({
    wood: fullAtOf(stores.value.wood),
    stone: fullAtOf(stores.value.stone),
    iron: fullAtOf(stores.value.iron),
    gold: fullAtOf(stores.value.gold),
    food: fullAtOf(stores.value.food),
  })
}
