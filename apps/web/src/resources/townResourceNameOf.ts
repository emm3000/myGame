import type { ResourceKind } from '@mygame/contracts'
import type { ChromeCatalog } from '../copy/PlayerCopy'

const townResourceNames: Readonly<Record<ResourceKind, (catalog: ChromeCatalog) => string>> = {
  money: (catalog) => catalog.namesTownResourcesMoney(),
  food: (catalog) => catalog.namesTownResourcesFood(),
  power: (catalog) => catalog.namesTownResourcesPower(),
  material: (catalog) => catalog.namesTownResourcesMaterial(),
}

export function townResourceNameOf(catalog: ChromeCatalog, resource: ResourceKind): string {
  return townResourceNames[resource](catalog)
}
