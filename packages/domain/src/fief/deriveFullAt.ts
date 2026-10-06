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

const storedStoreOf = (fief: Fief, kind: ResourceKind, capacityUnits: number): Store =>
  fief.stocks[kind] >= capacityUnits
    ? { kind: 'settled', fullAt: fief.storedAt }
    : { kind: 'filling', amount: fief.stocks[kind], unchangedSegments: 0 }

const fullAtOf = (store: Store): Instant | null => (store.kind === 'settled' ? store.fullAt : null)

export const deriveFullAt = (fief: Fief, catalog: BuildingCatalog): Result<FullAt, DomainError> => {
  const capacityUnits = deriveWarehouseCapacity(fief.buildingLevels.warehouse, catalog)
  if (!capacityUnits.ok) {
    return capacityUnits
  }
  const settings = catalog.fiefSettings()
  const stores: Record<ResourceKind, Store> = {
    wood: storedStoreOf(fief, 'wood', capacityUnits.value),
    stone: storedStoreOf(fief, 'stone', capacityUnits.value),
    iron: storedStoreOf(fief, 'iron', capacityUnits.value),
    gold: storedStoreOf(fief, 'gold', capacityUnits.value),
    food: storedStoreOf(fief, 'food', capacityUnits.value),
  }
  let segmentStart = fief.storedAt
  while (resourceKinds.some((kind) => stores[kind].kind === 'filling')) {
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
    for (const kind of resourceKinds) {
      const store = stores[kind]
      if (store.kind === 'filling') {
        stores[kind] = storeAfter(
          store.amount,
          store.unchangedSegments,
          rates.value[kind],
          capacityUnits.value,
          segmentStart,
          segmentEnd,
        )
      }
    }
    segmentStart = segmentEnd
  }
  return ok({
    wood: fullAtOf(stores.wood),
    stone: fullAtOf(stores.stone),
    iron: fullAtOf(stores.iron),
    gold: fullAtOf(stores.gold),
    food: fullAtOf(stores.food),
  })
}
