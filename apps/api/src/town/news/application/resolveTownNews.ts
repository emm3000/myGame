import { type DomainError, ok, type PlayerId, type Result, type TownEvent } from '@mygame/domain'
import type { TownNewsReader } from '../../application/ports/TownNewsReader'
import { type CurrentTownDependencies, currentTownOf } from '../../application/resolveCurrentTown'

export type TownNewsDependencies = CurrentTownDependencies & {
  readonly townNews: TownNewsReader
}

export const townNewsOf = async (
  playerId: PlayerId,
  dependencies: TownNewsDependencies,
): Promise<Result<ReadonlyArray<TownEvent>, DomainError>> => {
  const reading = await currentTownOf(playerId, dependencies)
  if (!reading.ok) {
    return reading
  }
  return ok(await dependencies.townNews.newsOf(reading.value.town.id))
}
