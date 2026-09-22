import type { PlayerId } from '../player/PlayerId'
import type { ResourceKind } from '../resources/Resources'
import type { Instant } from '../time/Instant'
import type { BuildSlot } from './BuildSlot'
import type { Coordinates } from './Coordinates'
import type { FiefBuildingLevels } from './FiefBuildingLevels'
import type { FiefId } from './FiefId'
import type { FiefName } from './FiefName'
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

  get terrain(): Terrain {
    return terrainOf(this.coordinates)
  }
}
