import {
  cancelUpgrade,
  type DomainError,
  type Fief,
  type FiefOfPlayer,
  ok,
  type Result,
  type UpgradeTarget,
} from '@mygame/domain'
import { type MutateAfterResolveDependencies, mutateAfterResolve } from './mutateAfterResolve'

export type CancelUpgradeDependencies = MutateAfterResolveDependencies

export const cancelUpgradeOf = async (
  fiefOfPlayer: FiefOfPlayer,
  target: UpgradeTarget,
  dependencies: CancelUpgradeDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateAfterResolve(
    fiefOfPlayer,
    async ({ fiefs, chronicle }, clock) => {
      const cancelled = await cancelUpgrade(
        { ...fiefOfPlayer, ...target },
        { fiefs, chronicle, catalog: dependencies.buildingCatalog, clock },
      )
      return cancelled.ok ? ok(cancelled.value.fief) : cancelled
    },
    dependencies,
  )
