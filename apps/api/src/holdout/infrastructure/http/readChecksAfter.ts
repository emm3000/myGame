import {
  type Band,
  type Clock,
  type DomainError,
  type HoldoutCheckView,
  type HoldoutCheckWeek,
  type PlayerId,
  type Result,
  readHoldoutChecks,
} from '@mygame/domain'
import { readScaffold } from '#account/application/readScaffold'
import type { LearningDependencies } from '#learning/application/LearningDependencies'
import { mutateTown } from '#town/application/mutateTown'
import type { TownStores } from '#town/application/ports/TownStores'

export type HoldoutCheckCommand = {
  readonly playerId: PlayerId
  readonly band: Band
  readonly week: HoldoutCheckWeek
}

export type CheckMutation = (
  stores: TownStores,
  command: HoldoutCheckCommand,
  clock: Clock,
) => Promise<Result<unknown, DomainError>>

export const mutateHoldoutCheck = (
  command: HoldoutCheckCommand,
  mutation: CheckMutation,
  dependencies: LearningDependencies,
): Promise<Result<ReadonlyArray<HoldoutCheckView>, DomainError>> =>
  mutateTown(
    command.playerId,
    async (stores, mutationClock) => {
      const changed = await mutation(stores, command, mutationClock)
      if (!changed.ok) {
        return changed
      }
      return readHoldoutChecks(
        {
          playerId: command.playerId,
          scaffold: await readScaffold(command.playerId, stores.accounts),
        },
        { bandStarts: stores.bandStarts, words: dependencies.lessons, clock: mutationClock },
      )
    },
    dependencies,
  )
