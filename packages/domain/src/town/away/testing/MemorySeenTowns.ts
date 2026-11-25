import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import { laterOf } from '#time/laterOf'
import type { TownRepository } from '../../domain/TownRepository'
import type { SeenTowns } from '../domain/SeenTowns'

export class MemorySeenTowns implements SeenTowns {
  private readonly sightings = new Map<PlayerId, Instant>()

  constructor(private readonly towns: Pick<TownRepository, 'holdsTown'>) {}

  async markSeen(playerId: PlayerId, at: Instant): Promise<Result<void, DomainError>> {
    if (!(await this.towns.holdsTown(playerId))) {
      return err({ kind: 'TownNotFound', playerId })
    }
    const seenAt = this.sightings.get(playerId)
    this.sightings.set(playerId, seenAt === undefined ? at : laterOf(seenAt, at))
    return ok(undefined)
  }

  async seenAtOf(playerId: PlayerId): Promise<Instant | undefined> {
    return this.sightings.get(playerId)
  }
}
