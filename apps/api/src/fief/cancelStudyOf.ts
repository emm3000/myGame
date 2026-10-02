import {
  cancelStudy,
  type DomainError,
  type Fief,
  type FiefOfPlayer,
  ok,
  type Result,
  type StudyTarget,
} from '@mygame/domain'
import { type MutateAfterResolveDependencies, mutateAfterResolve } from './mutateAfterResolve'

export type CancelStudyDependencies = MutateAfterResolveDependencies

export const cancelStudyOf = async (
  fiefOfPlayer: FiefOfPlayer,
  target: StudyTarget,
  dependencies: CancelStudyDependencies,
): Promise<Result<Fief, DomainError>> =>
  mutateAfterResolve(
    fiefOfPlayer,
    async ({ fiefs, chronicle }, clock) => {
      const cancelled = await cancelStudy(
        { ...fiefOfPlayer, ...target },
        { fiefs, chronicle, catalog: dependencies.buildingCatalog, clock },
      )
      return cancelled.ok ? ok(cancelled.value.fief) : cancelled
    },
    dependencies,
  )
