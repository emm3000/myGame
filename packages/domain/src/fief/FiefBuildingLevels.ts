import type { BuildingKind } from '../ports/BuildingCatalog'

export type FiefBuildingLevels = Readonly<Record<BuildingKind, number>>
