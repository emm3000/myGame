import type { ArtKind, ArtLevel, BuildingCatalog } from '../ports/BuildingCatalog'

export const nextArtLevelOf = (
  art: ArtKind,
  level: number,
  catalog: BuildingCatalog,
): ArtLevel | undefined => {
  const next = catalog.artLevelOf(art, level + 1)
  return next !== undefined && next.art === art ? next : undefined
}
