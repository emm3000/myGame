import type { Terrain } from '@mygame/contracts'
import type { ChromeCatalog, PlayerCopy } from '../copy/PlayerCopy'
import type { Label } from '../design-system/Label'

const terrainNames: Readonly<Record<Terrain, (catalog: ChromeCatalog) => string>> = {
  fields: (catalog) => catalog.namesTerrainsFields(),
  river: (catalog) => catalog.namesTerrainsRiver(),
  hills: (catalog) => catalog.namesTerrainsHills(),
}

export function terrainNameOf(terrain: Terrain, copy: PlayerCopy): Label {
  return copy.chrome(terrainNames[terrain])
}
