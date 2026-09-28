export type { DomainError } from './DomainError'
export { artLevelInForce } from './fief/artLevelInForce'
export type { BuildQueue, BuildQueueEntry, UpgradeTarget } from './fief/BuildQueue'
export type { BuildSlot, BusySlot } from './fief/BuildSlot'
export { Coordinates } from './fief/Coordinates'
export type { PeasantCounts } from './fief/derivePeasantCounts'
export { derivePeasantCounts } from './fief/derivePeasantCounts'
export { derivePeasantsForUpgrade } from './fief/derivePeasantsForUpgrade'
export { deriveProjectedFreePeasants } from './fief/deriveProjectedFreePeasants'
export { deriveResourceRates } from './fief/deriveResourceRates'
export { deriveStudyDurationSeconds } from './fief/deriveStudyDurationSeconds'
export { deriveWarehouseCapacity } from './fief/deriveWarehouseCapacity'
export { Fief, type FiefFounding, type Stocks, type StoredFief } from './fief/Fief'
export type { FiefArtLevels } from './fief/FiefArtLevels'
export type { FiefBuildingLevels } from './fief/FiefBuildingLevels'
export type { FiefId } from './fief/FiefId'
export { FiefName } from './fief/FiefName'
export { nextArtLevelOf } from './fief/nextArtLevelOf'
export type { PlotAddress } from './fief/PlotAddress'
export type { BusyStudySlot, StudySlot } from './fief/StudySlot'
export { type ScheduledUpgrade, scheduleBuildQueue } from './fief/scheduleBuildQueue'
export type { Terrain } from './fief/Terrain'
export type { PlayerId } from './player/PlayerId'
export type {
  ArtKind,
  ArtLevel,
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
export {
  type StartStudyCommand,
  type StartStudyDependencies,
  startStudy,
} from './useCases/startStudy'
