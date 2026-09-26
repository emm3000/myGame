export type { DomainError } from './DomainError'
export type { BuildQueue, BuildQueueEntry } from './fief/BuildQueue'
export type { BuildSlot, BusySlot } from './fief/BuildSlot'
export { Coordinates } from './fief/Coordinates'
export { deriveFreePeasants } from './fief/deriveFreePeasants'
export { deriveOccupiedPeasants } from './fief/deriveOccupiedPeasants'
export { derivePeasantsForUpgrade } from './fief/derivePeasantsForUpgrade'
export { deriveResourceRates } from './fief/deriveResourceRates'
export { deriveSuppliedPeasants } from './fief/deriveSuppliedPeasants'
export { deriveWarehouseCapacity } from './fief/deriveWarehouseCapacity'
export { Fief, type FiefFounding, type Stocks, type StoredFief, type Upgrade } from './fief/Fief'
export type { FiefBuildingLevels } from './fief/FiefBuildingLevels'
export type { FiefId } from './fief/FiefId'
export { FiefName } from './fief/FiefName'
export type { PlotAddress } from './fief/PlotAddress'
export type { Terrain } from './fief/Terrain'
export type { PlayerId } from './player/PlayerId'
export type {
  BuildingCatalog,
  BuildingKind,
  BuildingLevel,
  FarmLevel,
  FiefSettings,
  ProducerLevel,
  TerrainBonus,
  WarehouseLevel,
} from './ports/BuildingCatalog'
export type { Clock } from './ports/Clock'
export type { FiefRepository } from './ports/FiefRepository'
export type { IdGenerator } from './ports/IdGenerator'
export { err, ok, type Result } from './Result'
export { type MaterializedResources, materializeResources } from './resources/materializeResources'
export type { ResourceKind, Resources } from './resources/Resources'
export { Resource } from './resources/Resources'
export { Duration } from './time/Duration'
export { Instant } from './time/Instant'
export {
  type CancelUpgradeCommand,
  type CancelUpgradeDependencies,
  cancelUpgrade,
} from './useCases/cancelUpgrade'
export {
  type EnqueueBuildingCommand,
  type EnqueueBuildingDependencies,
  enqueueBuilding,
} from './useCases/enqueueBuilding'
export {
  type FoundFiefCommand,
  type FoundFiefDependencies,
  foundFief,
} from './useCases/foundFief'
export {
  type ResolvedFief,
  type ResolveUpgradeCommand,
  type ResolveUpgradeDependencies,
  resolveUpgrade,
} from './useCases/resolveUpgrade'
