import {
  type BuildingKind,
  type DomainError,
  enqueueBuilding,
  type Fief,
  type FiefOfPlayer,
  type Result,
} from '@mygame/domain'
import { type MutateAfterResolveDependencies, mutateAfterResolve } from './mutateAfterResolve'

export type EnqueueUpgradeDependencies = MutateAfterResolveDependencies

export const enqueueUpgradeOf = async (
  fiefOfPlayer: FiefOfPlayer,
  building: BuildingKind,
  dependencies: EnqueueUpgradeDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateAfterResolve(
    fiefOfPlayer,
    ({ fiefs }, clock) =>
      enqueueBuilding(
        { ...fiefOfPlayer, building },
        { fiefs, catalog: dependencies.buildingCatalog, clock },
      ),
    dependencies,
  )
