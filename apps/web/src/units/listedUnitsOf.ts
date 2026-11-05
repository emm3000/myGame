import { UnitKindSchema } from '@mygame/contracts'
import { countedUnitsOf } from './countedUnitsOf'
import type { UnitCounts } from './UnitCounts'

export function listedUnitsOf(counts: UnitCounts): ReadonlyArray<string> {
  return UnitKindSchema.options
    .filter((unit) => counts[unit] > 0)
    .map((unit) => countedUnitsOf(unit, counts[unit]))
}
