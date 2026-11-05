import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import type { BuildingLevels } from './BuildingLevels'
import { foundingLevels } from './BuildingLevels'
import { buildingKinds } from './buildingKinds'
import { type FullSince, noStoreFull } from './FullSince'
import { resourceKinds } from './resourceKinds'
import type { Stocks } from './Stocks'
import type { Terrain } from './Terrain'
import type { TownAddress } from './TownAddress'
import type { TownId } from './TownId'
import type { TownName } from './TownName'
import { terrainOf } from './terrainOf'

export type TownFounding = {
  readonly id: TownId
  readonly playerId: PlayerId
  readonly name: TownName
  readonly address: TownAddress
  readonly startingStocks: Stocks
  readonly at: Instant
}

export type StoredTown = {
  readonly id: TownId
  readonly playerId: PlayerId
  readonly name: TownName
  readonly address: TownAddress
  readonly stocks: Stocks
  readonly storedAt: Instant
  readonly fullSince: FullSince
  readonly buildingLevels: BuildingLevels
}

const isWholeFromZero = (value: number): boolean => Number.isInteger(value) && value >= 0

const refuseInvalidStocks = (stocks: Stocks): DomainError | undefined => {
  const negative = resourceKinds.find((resource) => !isWholeFromZero(stocks[resource]))
  return negative === undefined
    ? undefined
    : { kind: 'InvalidTownStock', resource: negative, amount: stocks[negative] }
}

const refuseInvalidLevels = (levels: BuildingLevels): DomainError | undefined => {
  const invalid = buildingKinds.find((building) => !isWholeFromZero(levels[building]))
  return invalid === undefined
    ? undefined
    : { kind: 'InvalidTownBuildingLevel', building: invalid, level: levels[invalid] }
}

export class Town {
  private constructor(
    readonly id: TownId,
    readonly playerId: PlayerId,
    readonly name: TownName,
    readonly address: TownAddress,
    readonly stocks: Stocks,
    readonly storedAt: Instant,
    readonly fullSince: FullSince,
    readonly buildingLevels: BuildingLevels,
  ) {}

  static found({ id, playerId, name, address, startingStocks, at }: TownFounding): Town {
    return new Town(id, playerId, name, address, startingStocks, at, noStoreFull, foundingLevels)
  }

  static restore(stored: StoredTown): Result<Town, DomainError> {
    const refusal = refuseInvalidStocks(stored.stocks) ?? refuseInvalidLevels(stored.buildingLevels)
    if (refusal !== undefined) {
      return err(refusal)
    }
    return ok(
      new Town(
        stored.id,
        stored.playerId,
        stored.name,
        stored.address,
        stored.stocks,
        stored.storedAt,
        stored.fullSince,
        stored.buildingLevels,
      ),
    )
  }

  get terrain(): Terrain {
    return terrainOf(this.address.area)
  }
}
