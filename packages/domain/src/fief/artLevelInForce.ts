import type { DomainError } from '../DomainError'
import type { ArtKind, ArtLevel, BuildingCatalog } from '../ports/BuildingCatalog'
import { ok, type Result } from '../Result'
import { artLineOf } from './artLineOf'

export const artLevelInForce = (
  art: ArtKind,
  level: number,
  catalog: BuildingCatalog,
): Result<ArtLevel | undefined, DomainError> => {
  if (level === 0) {
    return ok(undefined)
  }
  return artLineOf(art, level, catalog)
}
