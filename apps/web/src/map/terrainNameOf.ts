import { namesTerrainsFields, namesTerrainsHills, namesTerrainsRiver } from '@mygame/catalog'
import type { Terrain } from '@mygame/contracts'

const terrainNames: Readonly<Record<Terrain, () => string>> = {
  fields: namesTerrainsFields,
  river: namesTerrainsRiver,
  hills: namesTerrainsHills,
}

export function terrainNameOf(terrain: Terrain): string {
  return terrainNames[terrain]()
}
