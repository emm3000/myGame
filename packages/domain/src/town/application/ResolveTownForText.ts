import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import type { Result } from '#Result'
import type { TownReading } from '../domain/TownReading'
import type { ResolveTownReadingDependencies } from './resolveStoredTownReading'
import { resolveTownReading } from './resolveTownReading'

export type ResolveTownForTextDependencies = ResolveTownReadingDependencies

export class ResolveTownForText {
  constructor(private readonly dependencies: ResolveTownForTextDependencies) {}

  async execute(playerId: PlayerId): Promise<Result<TownReading, DomainError>> {
    return resolveTownReading(playerId, this.dependencies)
  }
}
