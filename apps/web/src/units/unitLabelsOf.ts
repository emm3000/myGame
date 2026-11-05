import {
  namesUnitsArcherPlural,
  namesUnitsArcherSingular,
  namesUnitsCavalryPlural,
  namesUnitsCavalrySingular,
  namesUnitsInfantryPlural,
  namesUnitsInfantrySingular,
  namesUnitsSettlerPlural,
  namesUnitsSettlerSingular,
} from '@mygame/catalog'
import type { UnitKind } from '@mygame/contracts'

export interface UnitLabels {
  readonly singular: string
  readonly plural: string
}

const unitLabels: Readonly<Record<UnitKind, () => UnitLabels>> = {
  infantry: () => ({ singular: namesUnitsInfantrySingular(), plural: namesUnitsInfantryPlural() }),
  cavalry: () => ({ singular: namesUnitsCavalrySingular(), plural: namesUnitsCavalryPlural() }),
  archer: () => ({ singular: namesUnitsArcherSingular(), plural: namesUnitsArcherPlural() }),
  settler: () => ({ singular: namesUnitsSettlerSingular(), plural: namesUnitsSettlerPlural() }),
}

export function unitLabelsOf(unit: UnitKind): UnitLabels {
  return unitLabels[unit]()
}
