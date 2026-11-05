import { namesCountedUnits } from '@mygame/catalog'
import type { UnitKind } from '@mygame/contracts'
import { unitLabelsOf } from './unitLabelsOf'

export function countedUnitsOf(unit: UnitKind, count: number): string {
  return namesCountedUnits({ count, ...unitLabelsOf(unit) })
}
