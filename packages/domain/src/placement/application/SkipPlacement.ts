import { readScaffold } from '#account/application/readScaffold'
import type { DomainError } from '#DomainError'
import type { BandCatalog } from '#learning/curriculum/domain/BandCatalog'
import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import { type MutateTownDependencies, mutateTown } from '#town/application/mutateTown'
import type { SkippedPlacement } from '../domain/Placement'
import type { PlacementRepository } from '../domain/PlacementRepository'
import type { PlacementView } from '../domain/PlacementView'
import type { PlacementWordCatalog } from '../domain/PlacementWordCatalog'
import { admitPlacementOffer, type PlacementOfferDependencies } from './admitPlacementOffer'
import { readPlacementView } from './readPlacementView'

export type SkipPlacementCommand = {
  readonly playerId: PlayerId
}

type SkipPorts = PlacementOfferDependencies & {
  readonly placements: PlacementRepository
  readonly clock: Clock
}

const skipPlacementIn = async (
  { playerId }: SkipPlacementCommand,
  dependencies: SkipPorts,
): Promise<Result<SkippedPlacement, DomainError>> => {
  const admitted = await admitPlacementOffer(playerId, dependencies)
  if (!admitted.ok) {
    return admitted
  }
  const placement: SkippedPlacement = { kind: 'skipped', skippedAt: dependencies.clock.now() }
  const saved = await dependencies.placements.save(playerId, placement)
  if (!saved.ok) {
    return saved
  }
  return ok(placement)
}

export type SkipPlacementDependencies = MutateTownDependencies & {
  readonly lessons: PlacementWordCatalog & Pick<BandCatalog, 'wordsOfBand' | 'hasLessons'>
}

export class SkipPlacement {
  constructor(private readonly dependencies: SkipPlacementDependencies) {}

  async execute({ playerId }: SkipPlacementCommand): Promise<Result<PlacementView, DomainError>> {
    const { lessons } = this.dependencies
    return mutateTown(
      playerId,
      async (stores, clock) => {
        const skipped = await skipPlacementIn(
          { playerId },
          {
            placements: stores.placements,
            bandStarts: stores.bandStarts,
            words: lessons,
            bands: lessons,
            clock,
          },
        )
        const scaffold = await readScaffold(playerId, stores.accounts)
        return skipped.ok
          ? readPlacementView(
              { playerId, scaffold },
              {
                placements: stores.placements,
                bandStarts: stores.bandStarts,
                words: lessons,
                bands: lessons,
              },
            )
          : skipped
      },
      this.dependencies,
    )
  }
}
