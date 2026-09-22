import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingKind } from '../ports/BuildingCatalog'
import { err, ok, type Result } from '../Result'
import type { ResourceKind } from '../resources/Resources'
import type { Instant } from '../time/Instant'
import type { BuildSlot } from './BuildSlot'
import { Coordinates } from './Coordinates'
import type { FiefBuildingLevels } from './FiefBuildingLevels'
import type { FiefId } from './FiefId'
import { FiefName } from './FiefName'
import type { PlotAddress } from './PlotAddress'
import type { Terrain } from './Terrain'
import { terrainOf } from './terrainOf'

export type Stocks = Readonly<Record<ResourceKind, number>>

export type FiefFounding = {
  readonly id: FiefId
  readonly playerId: PlayerId
  readonly name: FiefName
  readonly coordinates: Coordinates
  readonly startingStocks: Stocks
  readonly at: Instant
}

export type StoredFief = {
  readonly id: FiefId
  readonly playerId: PlayerId
  readonly name: string
  readonly address: PlotAddress
  readonly stocks: Stocks
  readonly storedAt: Instant
  readonly buildingLevels: FiefBuildingLevels
  readonly slot: BuildSlot
}

export type Upgrade = {
  readonly building: BuildingKind
  readonly targetLevel: number
  readonly cost: Stocks
  readonly finishesAt: Instant
}

const debit = (stocks: Stocks, cost: Stocks): Stocks => ({
  wood: stocks.wood - cost.wood,
  stone: stocks.stone - cost.stone,
  iron: stocks.iron - cost.iron,
  gold: stocks.gold - cost.gold,
  food: stocks.food - cost.food,
})

const shortfall = (stocks: Stocks, cost: Stocks): Stocks => ({
  wood: Math.max(0, cost.wood - stocks.wood),
  stone: Math.max(0, cost.stone - stocks.stone),
  iron: Math.max(0, cost.iron - stocks.iron),
  gold: Math.max(0, cost.gold - stocks.gold),
  food: Math.max(0, cost.food - stocks.food),
})

const isShort = (missing: Stocks): boolean => Object.values(missing).some((amount) => amount > 0)

const unbuiltLevels: FiefBuildingLevels = {
  sawmill: 0,
  quarry: 0,
  ironMine: 0,
  farm: 0,
  warehouse: 0,
}

export class Fief {
  private constructor(
    readonly id: FiefId,
    readonly playerId: PlayerId,
    readonly name: FiefName,
    readonly coordinates: Coordinates,
    readonly stocks: Stocks,
    readonly storedAt: Instant,
    readonly buildingLevels: FiefBuildingLevels,
    readonly slot: BuildSlot,
  ) {}

  static found(founding: FiefFounding): Fief {
    return new Fief(
      founding.id,
      founding.playerId,
      founding.name,
      founding.coordinates,
      founding.startingStocks,
      founding.at,
      unbuiltLevels,
      { kind: 'idle' },
    )
  }

  static restore(stored: StoredFief): Result<Fief, DomainError> {
    const name = FiefName.create(stored.name)
    if (!name.ok) {
      return name
    }
    const negativeAmount = Object.values(stored.stocks).find((amount) => amount < 0)
    if (negativeAmount !== undefined) {
      return err({ kind: 'NegativeResourceAmount', amount: negativeAmount })
    }
    const { kingdom, province, plot } = stored.address
    const coordinates = Coordinates.create(kingdom, province, plot)
    if (!coordinates.ok) {
      return coordinates
    }
    return ok(
      new Fief(
        stored.id,
        stored.playerId,
        name.value,
        coordinates.value,
        stored.stocks,
        stored.storedAt,
        stored.buildingLevels,
        stored.slot,
      ),
    )
  }

  startUpgrade(upgrade: Upgrade, stocksAtNow: Stocks, now: Instant): Result<Fief, DomainError> {
    if (this.slot.kind === 'busy') {
      return err({ kind: 'SlotBusy', until: this.slot.finishesAt })
    }
    const { building, targetLevel, cost, finishesAt } = upgrade
    const missing = shortfall(stocksAtNow, cost)
    if (isShort(missing)) {
      return err({ kind: 'InsufficientResources', missing })
    }
    return ok(
      new Fief(
        this.id,
        this.playerId,
        this.name,
        this.coordinates,
        debit(stocksAtNow, cost),
        now,
        this.buildingLevels,
        { kind: 'busy', building, targetLevel, finishesAt },
      ),
    )
  }

  get terrain(): Terrain {
    return terrainOf(this.coordinates)
  }
}
