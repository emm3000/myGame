import type { DomainError } from '../DomainError'
import type { ArtKind, ArtLevel, BuildingCatalog } from '../ports/BuildingCatalog'
import { err, ok, type Result } from '../Result'

export const artLevelInForce = (
  art: ArtKind,
  level: number,
  catalog: BuildingCatalog,
): Result<ArtLevel | undefined, DomainError> => {
  if (level === 0) {
    return ok(undefined)
  }
  const found = catalog.artLevelOf(art, level)
  if (found === undefined || found.art !== art) {
    return err({ kind: 'UnknownArtLevel', art, level })
  }
  return ok(found)
}
