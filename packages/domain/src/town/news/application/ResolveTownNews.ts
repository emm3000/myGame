import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import {
  type ResolveTownReadingDependencies,
  resolveTownReading,
} from '../../application/resolveTownReading'
import type { TownEvent } from '../../domain/TownEvent'
import type { TownNewsReader } from '../../domain/TownNewsReader'

export type ResolveTownNewsDependencies = ResolveTownReadingDependencies & {
  readonly townNews: TownNewsReader
}

export class ResolveTownNews {
  constructor(private readonly dependencies: ResolveTownNewsDependencies) {}

  async execute(playerId: PlayerId): Promise<Result<ReadonlyArray<TownEvent>, DomainError>> {
    const reading = await resolveTownReading(playerId, this.dependencies)
    if (!reading.ok) {
      return reading
    }
    return ok(await this.dependencies.townNews.newsOf(reading.value.town.id))
  }
}
