import { type DomainError, err, type Instant, ok, type PlayerId, type Result } from '@mygame/domain'
import type { TownReader } from './TownReader'
import type { TownReading } from './TownReading'

export const townReadingOf = async (
  playerId: PlayerId,
  at: Instant,
  towns: Pick<TownReader, 'townWithSchoolOf'>,
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
