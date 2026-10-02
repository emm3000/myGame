import {
  type DomainError,
  type Fief,
  type FiefOfPlayer,
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
  fiefOfPlayer: FiefOfPlayer,
  { unit, count }: RecruitOrderRequest,
  dependencies: PlaceRecruitOrderDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateAfterResolve(
    fiefOfPlayer,
    ({ fiefs }, clock) =>
      placeRecruitOrder(
        { ...fiefOfPlayer, unit, count },
        { fiefs, catalog: dependencies.buildingCatalog, clock },
      ),
    dependencies,
  )
