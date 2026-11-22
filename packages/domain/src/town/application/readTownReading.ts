import type { DomainError } from '#DomainError'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import type { TownReader } from '../domain/TownReader'
import type { TownReading } from '../domain/TownReading'

export const readTownReading = async (
  playerId: PlayerId,
  at: Instant,
  towns: TownReader,
): Promise<Result<TownReading, DomainError>> => {
  const stored = await towns.townWithSchoolOf(playerId)
  if (!stored.ok) {
    return stored
  }
  if (stored.value === undefined) {
    return err({ kind: 'TownNotFound', playerId })
  }
  return ok({ ...stored.value, at })
}
