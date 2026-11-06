import type { BuildingKind } from './BuildingKind'
import type { ResourceKind } from './ResourceKind'

export type ProducerBuilding = Extract<BuildingKind, 'farm' | 'factory' | 'powerStation'>

const producers: Readonly<Record<ResourceKind, ProducerBuilding | null>> = {
  money: null,
  food: 'farm',
  power: 'powerStation',
  material: 'factory',
}

export const producerOf = (resource: ResourceKind): ProducerBuilding | null => producers[resource]
