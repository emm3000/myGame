import {
  type BuildingKind,
  type DomainError,
  enqueueBuilding,
  type Fief,
  type PlayerId,
  type Result,
} from '@mygame/domain'
import { type MutateAfterResolveDependencies, mutateAfterResolve } from './mutateAfterResolve'

export type EnqueueUpgradeDependencies = MutateAfterResolveDependencies

export const enqueueUpgradeOf = async (
  playerId: PlayerId,
  building: BuildingKind,
  dependencies: EnqueueUpgradeDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateAfterResolve(
    playerId,
    ({ fiefs }, clock) =>
      enqueueBuilding(
        { playerId, building },
        { fiefs, catalog: dependencies.buildingCatalog, clock },
      ),
    dependencies,
  )
