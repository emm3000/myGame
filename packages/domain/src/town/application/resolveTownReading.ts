import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import { err, type Result } from '#Result'
import type { TownReading } from '../domain/TownReading'
import {
  type ResolveTownReadingDependencies,
  resolveStoredTownReading,
} from './resolveStoredTownReading'

export const resolveTownReading = async (
  playerId: PlayerId,
  dependencies: ResolveTownReadingDependencies,
): Promise<Result<TownReading, DomainError>> => {
  const stored = await dependencies.townsWithSchool.townWithSchoolOf(playerId)
  if (!stored.ok) {
    return stored
  }
  if (stored.value === undefined) {
    return err({ kind: 'TownNotFound', playerId })
  }
  return resolveStoredTownReading(playerId, stored.value, dependencies)
}
