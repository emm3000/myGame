import {
  cancelRecruitOrder,
  type DomainError,
  type Fief,
  type FiefOfPlayer,
  Instant,
  ok,
  type Result,
  type UnitKind,
} from '@mygame/domain'
import { type MutateAfterResolveDependencies, mutateAfterResolve } from './mutateAfterResolve'

export type CancelRecruitOrderDependencies = MutateAfterResolveDependencies

export type RecruitOrderCancelRequest = {
  readonly unit: UnitKind
  readonly startedAt: string
}

export const cancelRecruitOrderOf = async (
  fiefOfPlayer: FiefOfPlayer,
  { unit, startedAt }: RecruitOrderCancelRequest,
  dependencies: CancelRecruitOrderDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateAfterResolve(
    fiefOfPlayer,
    async ({ fiefs, chronicle }, clock) => {
      const cancelled = await cancelRecruitOrder(
        { ...fiefOfPlayer, unit, startedAt: Instant.fromEpochMilliseconds(Date.parse(startedAt)) },
        { fiefs, chronicle, catalog: dependencies.buildingCatalog, clock },
      )
      return cancelled.ok ? ok(cancelled.value.fief) : cancelled
    },
    dependencies,
  )
