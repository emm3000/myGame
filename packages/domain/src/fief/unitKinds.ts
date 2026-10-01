import type { UnitKind } from '../ports/BuildingCatalog'
import { byUnitKind } from './byUnitKind'

const everyUnit = byUnitKind(() => true)

const isUnitKind = (key: string): key is UnitKind => key in everyUnit

export const unitKinds: ReadonlyArray<UnitKind> = Object.keys(everyUnit).filter(isUnitKind)
