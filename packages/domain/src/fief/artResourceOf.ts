import type { DomainError } from '../DomainError'
import type { ArtKind, BuildingCatalog } from '../ports/BuildingCatalog'
import { ok, type Result } from '../Result'
import type { ResourceKind } from '../resources/Resources'
import { artLineOf } from './artLineOf'

export const artResourceOf = (
  art: ArtKind,
  catalog: BuildingCatalog,
): Result<ResourceKind, DomainError> => {
  const firstLevel = artLineOf(art, 1, catalog)
  if (!firstLevel.ok) {
    return firstLevel
  }
  return ok(firstLevel.value.resource)
}
