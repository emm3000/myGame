import type { Terrain } from '@mygame/contracts'

const sceneArt: Readonly<Record<Terrain, string | undefined>> = {
  lowlands: undefined,
  uplands: undefined,
  ridges: undefined,
}

export function sceneArtOf(terrain: Terrain): string | undefined {
  return sceneArt[terrain]
}
