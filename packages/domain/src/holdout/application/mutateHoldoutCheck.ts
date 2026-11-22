import { readScaffold } from '#account/application/readScaffold'
import type { DomainError } from '#DomainError'
import type { Band } from '#learning/curriculum/domain/Band'
import type { PlacementWordCatalog } from '#placement/domain/PlacementWordCatalog'
import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import type { Result } from '#Result'
import { type MutateTownDependencies, mutateTown } from '#town/application/mutateTown'
import type { TownStores } from '#town/domain/TownStores'
import type { HoldoutCheckView } from '../domain/HoldoutCheckView'
import type { HoldoutCheckWeek } from '../domain/HoldoutCheckWeek'
import { readHoldoutCheckViews } from './readHoldoutCheckViews'

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

export type MutateHoldoutCheckDependencies = MutateTownDependencies & {
  readonly lessons: PlacementWordCatalog
}

export const mutateHoldoutCheck = (
  command: HoldoutCheckCommand,
  mutation: CheckMutation,
  dependencies: MutateHoldoutCheckDependencies,
): Promise<Result<ReadonlyArray<HoldoutCheckView>, DomainError>> =>
  mutateTown(
    command.playerId,
    async (stores, mutationClock) => {
      const changed = await mutation(stores, command, mutationClock)
      if (!changed.ok) {
        return changed
      }
      const scaffold = await readScaffold(command.playerId, stores.accounts)
      if (!scaffold.ok) {
        return scaffold
      }
      return readHoldoutCheckViews(
        { playerId: command.playerId, scaffold: scaffold.value },
        { bandStarts: stores.bandStarts, words: dependencies.lessons, clock: mutationClock },
      )
    },
    dependencies,
  )
