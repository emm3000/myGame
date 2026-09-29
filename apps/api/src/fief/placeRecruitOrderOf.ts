import {
  type DomainError,
  type Fief,
  type PlayerId,
  placeRecruitOrder,
  type Result,
  type UnitKind,
} from '@mygame/domain'
import { type MutateAfterResolveDependencies, mutateAfterResolve } from './mutateAfterResolve'

export type PlaceRecruitOrderDependencies = MutateAfterResolveDependencies

export type RecruitOrderRequest = {
  readonly unit: UnitKind
  readonly count: number
}

export const placeRecruitOrderOf = async (
  playerId: PlayerId,
  { unit, count }: RecruitOrderRequest,
  dependencies: PlaceRecruitOrderDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateAfterResolve(
    playerId,
    ({ fiefs }, clock) =>
      placeRecruitOrder(
        { playerId, unit, count },
        { fiefs, catalog: dependencies.buildingCatalog, clock },
      ),
    dependencies,
  )
