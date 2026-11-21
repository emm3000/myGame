import type { BuildingKind } from '../BuildingKind'

export type ProducerBuilding = Extract<BuildingKind, 'farm' | 'factory' | 'powerStation'>
