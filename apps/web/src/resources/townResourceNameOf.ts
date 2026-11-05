import {
  namesTownResourcesFood,
  namesTownResourcesMaterial,
  namesTownResourcesMoney,
  namesTownResourcesPower,
} from '@mygame/catalog'
import type { ResourceKind } from '@mygame/contracts/town'

const townResourceNames: Readonly<Record<ResourceKind, () => string>> = {
  money: namesTownResourcesMoney,
  food: namesTownResourcesFood,
  power: namesTownResourcesPower,
  material: namesTownResourcesMaterial,
}

export function townResourceNameOf(resource: ResourceKind): string {
  return townResourceNames[resource]()
}
