import { namesTerrainsLowlands, namesTerrainsRidges, namesTerrainsUplands } from '@mygame/catalog'
import type { Terrain } from '@mygame/contracts'

const terrainNames: Readonly<Record<Terrain, () => string>> = {
  lowlands: namesTerrainsLowlands,
  uplands: namesTerrainsUplands,
  ridges: namesTerrainsRidges,
}

export function terrainNameOf(terrain: Terrain): string {
  return terrainNames[terrain]()
}
