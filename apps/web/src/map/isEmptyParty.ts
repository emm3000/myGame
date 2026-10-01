import { UnitKindSchema } from '@mygame/contracts'
import type { UnitCounts } from './unitsAtHomeOf'

export function isEmptyParty(party: UnitCounts): boolean {
  return UnitKindSchema.options.every((unit) => party[unit] === 0)
}
