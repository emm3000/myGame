import type { HoldoutCheckRequest } from '@mygame/contracts'
import {
  type Clock,
  type DomainError,
  type HoldoutCheckView,
  type PlayerId,
  type Result,
  readHoldoutChecks,
} from '@mygame/domain'
import { readScaffold } from '../../../account/application/readScaffold'
import type { LearningDependencies } from '../../../learning/LearningDependencies'
import { mutateTown, type TownStores } from '../../../town/mutateTown'

export type CheckMutation = (
  stores: TownStores,
  check: HoldoutCheckRequest,
  clock: Clock,
) => Promise<Result<unknown, DomainError>>

export const readChecksAfter = (
  playerId: PlayerId,
  check: HoldoutCheckRequest,
  mutation: CheckMutation,
  dependencies: LearningDependencies,
): Promise<Result<ReadonlyArray<HoldoutCheckView>, DomainError>> =>
  mutateTown(
    playerId,
    async (stores, mutationClock) => {
      const changed = await mutation(stores, check, mutationClock)
      if (!changed.ok) {
        return changed
      }
      return readHoldoutChecks(
        { playerId, scaffold: await readScaffold(playerId, stores.accounts) },
        { bandStarts: stores.bandStarts, words: dependencies.lessons, clock: mutationClock },
      )
    },
    dependencies,
  )
