import type { UnitKind } from '../ports/BuildingCatalog'

const everyUnit: Readonly<Record<UnitKind, true>> = { infantry: true }

const isUnitKind = (key: string): key is UnitKind => key in everyUnit

export const unitKinds: ReadonlyArray<UnitKind> = Object.keys(everyUnit).filter(isUnitKind)
