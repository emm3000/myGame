import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import type { Result } from '#Result'
import { type MutateTownDependencies, mutateTown } from '../../application/mutateTown'

export type DismissGuidanceDependencies = MutateTownDependencies

export class DismissGuidance {
  constructor(private readonly dependencies: DismissGuidanceDependencies) {}

  async execute(playerId: PlayerId): Promise<Result<void, DomainError>> {
    return mutateTown(
      playerId,
      (stores, clock) => stores.guidanceDismissals.dismiss(playerId, clock.now()),
      this.dependencies,
    )
  }
}
