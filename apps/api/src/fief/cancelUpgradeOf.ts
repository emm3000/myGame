import {
  cancelUpgrade,
  type DomainError,
  type Fief,
  ok,
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
    async (fiefs, clock) => {
      const cancelled = await cancelUpgrade(
        { playerId, ...target },
        { fiefs, catalog: dependencies.buildingCatalog, clock },
      )
      return cancelled.ok ? ok(cancelled.value.fief) : cancelled
    },
    dependencies,
  )
