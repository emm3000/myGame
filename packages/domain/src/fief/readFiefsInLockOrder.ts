import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type { FiefRepository } from '../ports/FiefRepository'
import { ok, type Result } from '../Result'
import type { Fief } from './Fief'

export const readFiefsInLockOrder = async (
  playerId: PlayerId,
  fiefs: Pick<FiefRepository, 'fiefsOf' | 'fiefOf'>,
): Promise<Result<ReadonlyArray<Fief>, DomainError>> => {
  const fiefIds = [...(await fiefs.fiefsOf(playerId))].sort()
  const read: Array<Fief> = []
  for (const fiefId of fiefIds) {
    const stored = await fiefs.fiefOf(fiefId)
    if (!stored.ok) {
      return stored
    }
    if (stored.value !== undefined) {
      read.push(stored.value)
    }
  }
  return ok(read)
}
