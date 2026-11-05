import {
  namesResourcesFood,
  namesResourcesGold,
  namesResourcesIron,
  namesResourcesStone,
  namesResourcesWood,
} from '@mygame/catalog'
import type { ResourceKind } from '@mygame/contracts'

const resourceNames: Readonly<Record<ResourceKind, () => string>> = {
  wood: namesResourcesWood,
  stone: namesResourcesStone,
  iron: namesResourcesIron,
  gold: namesResourcesGold,
  food: namesResourcesFood,
}

export function resourceNameOf(resource: ResourceKind): string {
  return resourceNames[resource]()
}
