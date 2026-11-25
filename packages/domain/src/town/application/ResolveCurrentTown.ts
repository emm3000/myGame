import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import { awayOf } from '../away/domain/awayOf'
import type { SeenTowns } from '../away/domain/SeenTowns'
import type { TownOverviewReading } from '../away/domain/TownOverviewReading'
import {
  type ResolveTownReadingDependencies,
  resolveStoredTownReading,
} from './resolveStoredTownReading'

export type ResolveCurrentTownDependencies = ResolveTownReadingDependencies & {
  readonly seenTowns: SeenTowns
}

export class ResolveCurrentTown {
  constructor(private readonly dependencies: ResolveCurrentTownDependencies) {}

  async execute(playerId: PlayerId): Promise<Result<TownOverviewReading, DomainError>> {
    const stored = await this.dependencies.townsWithSchool.townWithSchoolOf(playerId)
    if (!stored.ok) {
      return stored
    }
    if (stored.value === undefined) {
      return err({ kind: 'TownNotFound', playerId })
    }
    const reading = await resolveStoredTownReading(playerId, stored.value, this.dependencies)
    if (!reading.ok) {
      return reading
    }
    const { town, at } = reading.value
    const away = awayOf(
      { stored: stored.value.town, seenAt: stored.value.seenAt, read: town, readAt: at },
      this.dependencies.townCatalog,
    )
    if (!away.ok) {
      return away
    }
    const seen = await this.dependencies.seenTowns.markSeen(playerId, at)
    return seen.ok ? ok({ ...reading.value, away: away.value }) : seen
  }
}
