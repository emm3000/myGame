import type { DomainError } from '../DomainError'
import type { ArtKind, ArtLevel, BuildingCatalog } from '../ports/BuildingCatalog'
import { err, ok, type Result } from '../Result'

export const artLineOf = (
  art: ArtKind,
  level: number,
  catalog: BuildingCatalog,
): Result<ArtLevel, DomainError> => {
  const found = catalog.artLevelOf(art, level)
  if (found === undefined || found.art !== art) {
    return err({ kind: 'UnknownArtLevel', art, level })
  }
  return ok(found)
}
