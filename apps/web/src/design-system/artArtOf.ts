import type { ArtKind } from '@mygame/contracts'

export function artArtOf(art: ArtKind): string {
  return `/art/arts/${art}.webp`
}
