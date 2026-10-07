import {
  type BuildingCatalog,
  type DomainError,
  deriveFullAt,
  type Fief,
  ok,
  type Result,
} from '@mygame/domain'
import type { FiefReading } from './FiefReading'

export const storedFiefReadingOf = (
  fief: Fief,
  catalog: BuildingCatalog,
): Result<FiefReading, DomainError> => {
  const fullAt = deriveFullAt(fief, catalog)
  if (!fullAt.ok) {
    return fullAt
  }
  return ok({ fief, fullAt: fullAt.value })
}
