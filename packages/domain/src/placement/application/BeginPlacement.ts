import { readScaffold } from '#account/application/readScaffold'
import type { DomainError } from '#DomainError'
import type { BandCatalog } from '#learning/curriculum/ports/BandCatalog'
import type { Clock } from '#platform/domain/Clock'
import type { RandomSource } from '#platform/domain/RandomSource'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import { type MutateTownDependencies, mutateTown } from '#town/application/mutateTown'
import type { TakenPlacement } from '../domain/Placement'
import type { PlacementRepository } from '../domain/PlacementRepository'
import type { PlacementView } from '../domain/PlacementView'
import type { PlacementWordCatalog } from '../domain/PlacementWordCatalog'
import { placementSamplesDrawn } from '../domain/placementSamplesDrawn'
import { admitPlacementOffer, type PlacementOfferDependencies } from './admitPlacementOffer'
import { readPlacementView } from './readPlacementView'

export type BeginPlacementCommand = {
  readonly playerId: PlayerId
}

type BeginPorts = PlacementOfferDependencies & {
  readonly placements: PlacementRepository
  readonly random: RandomSource
  readonly clock: Clock
}

const beginPlacementIn = async (
  { playerId }: BeginPlacementCommand,
  dependencies: BeginPorts,
): Promise<Result<TakenPlacement, DomainError>> => {
  const admitted = await admitPlacementOffer(playerId, dependencies)
  if (!admitted.ok) {
    return admitted
  }
  const placement: TakenPlacement = {
    kind: 'taken',
    begunAt: dependencies.clock.now(),
    samples: placementSamplesDrawn(dependencies, dependencies.random),
    scores: [],
  }
  const saved = await dependencies.placements.save(playerId, placement)
  if (!saved.ok) {
    return saved
  }
  return ok(placement)
}

export type BeginPlacementDependencies = MutateTownDependencies & {
  readonly lessons: PlacementWordCatalog & Pick<BandCatalog, 'wordsOfBand' | 'hasLessons'>
  readonly random: RandomSource
}

export class BeginPlacement {
  constructor(private readonly dependencies: BeginPlacementDependencies) {}

  async execute({ playerId }: BeginPlacementCommand): Promise<Result<PlacementView, DomainError>> {
    const { lessons, random } = this.dependencies
    return mutateTown(
      playerId,
      async (stores, clock) => {
        const begun = await beginPlacementIn(
          { playerId },
          {
            placements: stores.placements,
            bandStarts: stores.bandStarts,
            words: lessons,
            bands: lessons,
            random,
            clock,
          },
        )
        const scaffold = await readScaffold(playerId, stores.accounts)
        return begun.ok
          ? readPlacementView(
              { playerId, scaffold },
              {
                placements: stores.placements,
                bandStarts: stores.bandStarts,
                words: lessons,
                bands: lessons,
              },
            )
          : begun
      },
      this.dependencies,
    )
  }
}
