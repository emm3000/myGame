import type { ResourceKind } from './ResourceKind'

const everyResource: Readonly<Record<ResourceKind, true>> = {
  money: true,
  food: true,
  power: true,
  material: true,
}

const isResourceKind = (key: string): key is ResourceKind => key in everyResource

export const resourceKinds: ReadonlyArray<ResourceKind> =
  Object.keys(everyResource).filter(isResourceKind)
