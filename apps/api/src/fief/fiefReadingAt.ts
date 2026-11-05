import type { BuildingCatalog, DomainError, Fief, Instant, Result } from '@mygame/domain'
import { ok } from '@mygame/domain'
import { laterOf } from '../time/laterOf'
import type { FiefReading } from './FiefReading'
import { storedFiefReadingOf } from './storedFiefReadingOf'

export const fiefReadingAt = (
  fief: Fief,
  catalog: BuildingCatalog,
  at: Instant,
): Result<FiefReading, DomainError> => {
  const stored = storedFiefReadingOf(fief, catalog)
  if (!stored.ok) {
    return stored
  }
  const accrued = stored.value.fief.accruedTo(catalog, laterOf(at, fief.storedAt))
  if (!accrued.ok) {
    return accrued
  }
  return ok({ fief: accrued.value, fullAt: stored.value.fullAt })
}
