import {
  namesBuildingsBarracks,
  namesBuildingsFarm,
  namesBuildingsIronMine,
  namesBuildingsLibrary,
  namesBuildingsQuarry,
  namesBuildingsSawmill,
  namesBuildingsWarehouse,
} from '@mygame/catalog'
import type { BuildingKind } from '@mygame/contracts'

const buildingNames: Readonly<Record<BuildingKind, () => string>> = {
  sawmill: namesBuildingsSawmill,
  quarry: namesBuildingsQuarry,
  ironMine: namesBuildingsIronMine,
  farm: namesBuildingsFarm,
  warehouse: namesBuildingsWarehouse,
  library: namesBuildingsLibrary,
  barracks: namesBuildingsBarracks,
}

export function buildingNameOf(building: BuildingKind): string {
  return buildingNames[building]()
}
