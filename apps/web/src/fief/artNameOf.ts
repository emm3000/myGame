import { namesArtsMasonry, namesArtsSmithing } from '@mygame/catalog'
import type { ArtKind } from '@mygame/contracts'

const artNames: Readonly<Record<ArtKind, () => string>> = {
  smithing: namesArtsSmithing,
  masonry: namesArtsMasonry,
}

export function artNameOf(art: ArtKind): string {
  return artNames[art]()
}
