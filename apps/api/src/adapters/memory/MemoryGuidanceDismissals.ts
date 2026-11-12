import {
  type DomainError,
  err,
  type Instant,
  ok,
  type PlayerId,
  type Result,
  type TownRepository,
} from '@mygame/domain'
import type { GuidanceDismissals } from '../../town/GuidanceDismissals'

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
