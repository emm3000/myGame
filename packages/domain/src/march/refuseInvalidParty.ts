import type { DomainError } from '../DomainError'
import { FiefUnitCounts, type UnitCountsByKind } from '../fief/FiefUnitCounts'
import { unitKinds } from '../fief/unitKinds'
import { err, ok, type Result } from '../Result'

export const refuseInvalidParty = (units: UnitCountsByKind): Result<void, DomainError> => {
  const counts = FiefUnitCounts.create(units)
  if (!counts.ok) {
    return counts
  }
  const [firstUnit] = unitKinds
  if (firstUnit !== undefined && unitKinds.every((unit) => units[unit] === 0)) {
    return err({ kind: 'InvalidUnitCount', unit: firstUnit, count: 0 })
  }
  return ok(undefined)
}
