import type { HireKind } from './HireKind'
import type { TownCatalog } from './TownCatalog'

export const requiredOfficeLevelOf = (hire: HireKind, catalog: TownCatalog): number => {
  let level = 1
  for (
    let found = catalog.levelOf('office', level);
    found;
    found = catalog.levelOf('office', level)
  ) {
    if (found.building === 'office' && found.hires.includes(hire)) {
      return level
    }
    level += 1
  }
  return level
}
