import type { TownNewsFeed } from '@mygame/contracts'
import { type DomainError, ok, type PlayerId, type Result } from '@mygame/domain'
import { type CurrentTownDependencies, currentTownOf } from './currentTownOf'
import type { TownNewsReader } from './TownNewsReader'
import { townNewsItemOf } from './townNewsItemOf'

export type TownNewsDependencies = CurrentTownDependencies & {
  readonly townNews: TownNewsReader
}

export const townNewsOf = async (
  playerId: PlayerId,
  dependencies: TownNewsDependencies,
): Promise<Result<TownNewsFeed, DomainError>> => {
  const reading = await currentTownOf(playerId, dependencies)
  if (!reading.ok) {
    return reading
  }
  const events = await dependencies.townNews.newsOf(reading.value.town.id)
  return ok({ items: events.map(townNewsItemOf) })
}
