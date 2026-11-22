import type { TownNewsReader } from '@mygame/domain'
import {
  type DomainError,
  ok,
  type PlayerId,
  type ResolveTownReadingDependencies,
  type Result,
  resolveTownReading,
  type TownEvent,
} from '@mygame/domain'

export type ResolveTownNewsDependencies = ResolveTownReadingDependencies & {
  readonly townNews: TownNewsReader
}

export const resolveTownNews = async (
  playerId: PlayerId,
  dependencies: ResolveTownNewsDependencies,
): Promise<Result<ReadonlyArray<TownEvent>, DomainError>> => {
  const reading = await resolveTownReading(playerId, dependencies)
  if (!reading.ok) {
    return reading
  }
  return ok(await dependencies.townNews.newsOf(reading.value.town.id))
}
