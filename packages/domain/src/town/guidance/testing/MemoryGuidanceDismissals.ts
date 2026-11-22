import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import type { TownRepository } from '../../domain/TownRepository'
import type { GuidanceDismissals } from '../domain/GuidanceDismissals'

export class MemoryGuidanceDismissals implements GuidanceDismissals {
  private readonly dismissals = new Map<PlayerId, Instant>()

  constructor(private readonly towns: TownRepository) {}

  async dismiss(playerId: PlayerId, now: Instant): Promise<Result<void, DomainError>> {
    if (!(await this.towns.holdsTown(playerId))) {
      return err({ kind: 'TownNotFound', playerId })
    }
    if (!this.dismissals.has(playerId)) {
      this.dismissals.set(playerId, now)
    }
    return ok(undefined)
  }

  async dismissedAt(playerId: PlayerId): Promise<Instant | undefined> {
    return this.dismissals.get(playerId)
  }
}
