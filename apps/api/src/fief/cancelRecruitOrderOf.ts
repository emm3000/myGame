import {
  cancelRecruitOrder,
  type DomainError,
  type Fief,
  Instant,
  ok,
  type PlayerId,
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
  playerId: PlayerId,
  { unit, startedAt }: RecruitOrderCancelRequest,
  dependencies: CancelRecruitOrderDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateAfterResolve(
    playerId,
    async ({ fiefs, chronicle }, clock) => {
      const cancelled = await cancelRecruitOrder(
        { playerId, unit, startedAt: Instant.fromEpochMilliseconds(Date.parse(startedAt)) },
        { fiefs, chronicle, catalog: dependencies.buildingCatalog, clock },
      )
      return cancelled.ok ? ok(cancelled.value.fief) : cancelled
    },
    dependencies,
  )
