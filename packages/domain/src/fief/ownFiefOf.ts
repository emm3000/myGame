import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import type { Fief } from './Fief'
import type { FiefOfPlayer } from './FiefOfPlayer'

export const ownFiefOf = (
  stored: Fief | undefined,
  { playerId, fiefId }: FiefOfPlayer,
): Result<Fief, DomainError> =>
  stored === undefined || stored.playerId !== playerId
    ? err({ kind: 'FiefNotFound', fiefId })
    : ok(stored)
