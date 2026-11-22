import type { TownOverview } from '@mygame/contracts'
import type {
  BuildingsView,
  BuildingView,
  NextLevelView,
} from '../../application/gatherBuildingsView'

type BuildingState = TownOverview['buildings'][keyof TownOverview['buildings']]

const presentNextLevel = ({
  level,
  cost,
  durationSeconds,
  people,
  wordsNeeded,
}: NextLevelView): NonNullable<BuildingState['nextLevel']> => ({
  level,
  cost: { ...cost },
  durationSeconds,
  people,
  wordsNeeded:
    wordsNeeded === null ? null : { count: wordsNeeded.needed, standing: wordsNeeded.standing },
})

const presentBuilding = ({ level, nextLevel }: BuildingView): BuildingState => ({
  level,
  nextLevel: nextLevel === null ? null : presentNextLevel(nextLevel),
})

export const presentTownBuildings = (buildings: BuildingsView): TownOverview['buildings'] => ({
  homes: presentBuilding(buildings.homes),
  farm: presentBuilding(buildings.farm),
  factory: presentBuilding(buildings.factory),
  powerStation: presentBuilding(buildings.powerStation),
  storage: presentBuilding(buildings.storage),
  school: presentBuilding(buildings.school),
  office: presentBuilding(buildings.office),
})
