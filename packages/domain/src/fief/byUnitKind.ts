import type { UnitKind } from '../ports/BuildingCatalog'

export const byUnitKind = <T>(entryOf: (unit: UnitKind) => T): Readonly<Record<UnitKind, T>> => ({
  infantry: entryOf('infantry'),
  cavalry: entryOf('cavalry'),
})
