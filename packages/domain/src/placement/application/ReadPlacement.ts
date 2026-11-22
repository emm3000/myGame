import { readScaffold } from '#account/application/readScaffold'
import type { DomainError } from '#DomainError'
import type { BandCatalog } from '#learning/curriculum/domain/BandCatalog'
import type { PlayerId } from '#player/PlayerId'
import type { Result } from '#Result'
import { type MutateTownDependencies, mutateTown } from '#town/application/mutateTown'
import type { PlacementView } from '../domain/PlacementView'
import type { PlacementWordCatalog } from '../domain/PlacementWordCatalog'
import { readPlacementView } from './readPlacementView'

export type ReadPlacementQuery = {
  readonly playerId: PlayerId
}

export type ReadPlacementDependencies = MutateTownDependencies & {
  readonly lessons: PlacementWordCatalog & Pick<BandCatalog, 'wordsOfBand' | 'hasLessons'>
}

export class ReadPlacement {
  constructor(private readonly dependencies: ReadPlacementDependencies) {}

  async execute({ playerId }: ReadPlacementQuery): Promise<Result<PlacementView, DomainError>> {
    const { lessons } = this.dependencies
    return mutateTown(
      playerId,
      async (stores) =>
        readPlacementView(
          { playerId, scaffold: await readScaffold(playerId, stores.accounts) },
          {
            placements: stores.placements,
            bandStarts: stores.bandStarts,
            words: lessons,
            bands: lessons,
          },
        ),
      this.dependencies,
    )
  }
}
