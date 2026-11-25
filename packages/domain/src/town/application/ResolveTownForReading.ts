import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import type { Result } from '#Result'
import type { TownReading } from '../domain/TownReading'
import type { ResolveTownReadingDependencies } from './resolveStoredTownReading'
import { resolveTownReading } from './resolveTownReading'

export type ResolveTownForReadingDependencies = ResolveTownReadingDependencies

export class ResolveTownForReading {
  constructor(private readonly dependencies: ResolveTownForReadingDependencies) {}

  async execute(playerId: PlayerId): Promise<Result<TownReading, DomainError>> {
    return resolveTownReading(playerId, this.dependencies)
  }
}
