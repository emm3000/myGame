import type { ArtKind } from '../ports/BuildingCatalog'

const everyArt: Readonly<Record<ArtKind, true>> = { smithing: true, masonry: true }

const isArtKind = (key: string): key is ArtKind => key in everyArt

export const artKinds: ReadonlyArray<ArtKind> = Object.keys(everyArt).filter(isArtKind)
