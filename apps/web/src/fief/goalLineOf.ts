import {
  goalRaise,
  goalUpgrade,
  namesBuildingsWithDefiniteArticleBarracks,
  namesBuildingsWithDefiniteArticleFarm,
  namesBuildingsWithDefiniteArticleIronMine,
  namesBuildingsWithDefiniteArticleLibrary,
  namesBuildingsWithDefiniteArticleQuarry,
  namesBuildingsWithDefiniteArticleSawmill,
  namesBuildingsWithDefiniteArticleWarehouse,
  namesBuildingsWithIndefiniteArticleBarracks,
  namesBuildingsWithIndefiniteArticleFarm,
  namesBuildingsWithIndefiniteArticleIronMine,
  namesBuildingsWithIndefiniteArticleLibrary,
  namesBuildingsWithIndefiniteArticleQuarry,
  namesBuildingsWithIndefiniteArticleSawmill,
  namesBuildingsWithIndefiniteArticleWarehouse,
} from '@mygame/catalog'
import type { BuildingKind } from '@mygame/contracts'

const withIndefiniteArticle: Readonly<Record<BuildingKind, () => string>> = {
  sawmill: namesBuildingsWithIndefiniteArticleSawmill,
  quarry: namesBuildingsWithIndefiniteArticleQuarry,
  ironMine: namesBuildingsWithIndefiniteArticleIronMine,
  farm: namesBuildingsWithIndefiniteArticleFarm,
  warehouse: namesBuildingsWithIndefiniteArticleWarehouse,
  library: namesBuildingsWithIndefiniteArticleLibrary,
  barracks: namesBuildingsWithIndefiniteArticleBarracks,
}

const withDefiniteArticle: Readonly<Record<BuildingKind, () => string>> = {
  sawmill: namesBuildingsWithDefiniteArticleSawmill,
  quarry: namesBuildingsWithDefiniteArticleQuarry,
  ironMine: namesBuildingsWithDefiniteArticleIronMine,
  farm: namesBuildingsWithDefiniteArticleFarm,
  warehouse: namesBuildingsWithDefiniteArticleWarehouse,
  library: namesBuildingsWithDefiniteArticleLibrary,
  barracks: namesBuildingsWithDefiniteArticleBarracks,
}

export function goalLineOf(building: BuildingKind, level: number): string {
  return level === 1
    ? goalRaise({ building: withIndefiniteArticle[building]() })
    : goalUpgrade({ building: withDefiniteArticle[building](), level })
}
