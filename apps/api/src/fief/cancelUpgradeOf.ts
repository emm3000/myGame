import {
  cancelUpgrade,
  type DomainError,
  type Fief,
  type PlayerId,
  type Result,
  type UpgradeTarget,
} from '@mygame/domain'
import { type MutateAfterResolveDependencies, mutateAfterResolve } from './mutateAfterResolve'

export type CancelUpgradeDependencies = MutateAfterResolveDependencies

export const cancelUpgradeOf = async (
  playerId: PlayerId,
  target: UpgradeTarget,
  dependencies: CancelUpgradeDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateAfterResolve(
    playerId,
    (fiefs, clock) =>
      cancelUpgrade(
        { playerId, ...target },
        { fiefs, catalog: dependencies.buildingCatalog, clock },
      ),
    dependencies,
  )
