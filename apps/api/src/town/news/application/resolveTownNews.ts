import { type DomainError, ok, type PlayerId, type Result, type TownEvent } from '@mygame/domain'
import type { TownNewsReader } from '../../application/ports/TownNewsReader'
import {
  type ResolveCurrentTownDependencies,
  resolveCurrentTown,
} from '../../application/resolveCurrentTown'

export type ResolveTownNewsDependencies = ResolveCurrentTownDependencies & {
  readonly townNews: TownNewsReader
}

export const resolveTownNews = async (
  playerId: PlayerId,
  dependencies: ResolveTownNewsDependencies,
): Promise<Result<ReadonlyArray<TownEvent>, DomainError>> => {
  const reading = await resolveCurrentTown(playerId, dependencies)
  if (!reading.ok) {
    return reading
  }
  return ok(await dependencies.townNews.newsOf(reading.value.town.id))
}
