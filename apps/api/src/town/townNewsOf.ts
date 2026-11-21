import { type DomainError, ok, type PlayerId, type Result, type TownEvent } from '@mygame/domain'
import { type CurrentTownDependencies, currentTownOf } from './currentTownOf'
import type { TownNewsReader } from './TownNewsReader'

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
