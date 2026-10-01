import type { ResourceKind } from './Resources'

const everyResource: Readonly<Record<ResourceKind, true>> = {
  wood: true,
  stone: true,
  iron: true,
  gold: true,
  food: true,
}

const isResourceKind = (key: string): key is ResourceKind => key in everyResource

export const resourceKinds: ReadonlyArray<ResourceKind> =
  Object.keys(everyResource).filter(isResourceKind)
