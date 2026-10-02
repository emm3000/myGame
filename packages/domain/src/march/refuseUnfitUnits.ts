import type { DomainError } from '../DomainError'
import type { UnitCountsByKind } from '../fief/FiefUnitCounts'
import { err, ok, type Result } from '../Result'
import type { AwayMarch } from './March'

export const refuseUnfitUnits = (
  units: UnitCountsByKind,
  order: AwayMarch['order'],
): Result<void, DomainError> => {
  if (units.settler > 0) {
    return err({ kind: 'UnitUnfitForOrder', unit: 'settler', order })
  }
  return ok(undefined)
}
