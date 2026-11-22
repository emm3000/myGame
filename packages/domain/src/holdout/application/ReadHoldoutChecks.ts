import { readScaffold } from '#account/application/readScaffold'
import type { DomainError } from '#DomainError'
import type { PlacementWordCatalog } from '#placement/domain/PlacementWordCatalog'
import type { Clock } from '#platform/domain/Clock'
import type { UnitOfWork } from '#platform/domain/UnitOfWork'
import type { PlayerId } from '#player/PlayerId'
import type { Result } from '#Result'
import type { TownStores } from '#town/domain/TownStores'
import type { HoldoutCheckView } from '../domain/HoldoutCheckView'
import { readHoldoutCheckViews } from './readHoldoutCheckViews'

export type ReadHoldoutChecksQuery = {
  readonly playerId: PlayerId
}

export type ReadHoldoutChecksDependencies = {
  readonly unitOfWork: UnitOfWork<TownStores>
  readonly clock: Clock
  readonly lessons: PlacementWordCatalog
}

export class ReadHoldoutChecks {
  constructor(private readonly dependencies: ReadHoldoutChecksDependencies) {}

  async execute({
    playerId,
  }: ReadHoldoutChecksQuery): Promise<Result<ReadonlyArray<HoldoutCheckView>, DomainError>> {
    const { unitOfWork, lessons, clock } = this.dependencies
    return unitOfWork.transact(async (stores) =>
      readHoldoutCheckViews(
        { playerId, scaffold: await readScaffold(playerId, stores.accounts) },
        { bandStarts: stores.bandStarts, words: lessons, clock },
      ),
    )
  }
}
