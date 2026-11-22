import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import type { Result } from '#Result'
import type { TownReading } from '../domain/TownReading'
import { type ResolveTownReadingDependencies, resolveTownReading } from './resolveTownReading'

export type ResolveCurrentTownDependencies = ResolveTownReadingDependencies

export class ResolveCurrentTown {
  constructor(private readonly dependencies: ResolveCurrentTownDependencies) {}

  async execute(playerId: PlayerId): Promise<Result<TownReading, DomainError>> {
    return resolveTownReading(playerId, this.dependencies)
  }
}
