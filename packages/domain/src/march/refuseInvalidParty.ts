import type { DomainError } from '../DomainError'
import type { UnitCountsByKind } from '../fief/FiefUnitCounts'
import { unitKinds } from '../fief/unitKinds'
import { err, ok, type Result } from '../Result'

const isWholeCount = (count: number): boolean => Number.isInteger(count) && count >= 0

export const refuseInvalidParty = (units: UnitCountsByKind): Result<void, DomainError> => {
  const invalidUnit = unitKinds.find((unit) => !isWholeCount(units[unit]))
  if (invalidUnit !== undefined) {
    return err({ kind: 'InvalidUnitCount', unit: invalidUnit, count: units[invalidUnit] })
  }
  const [firstUnit] = unitKinds
  if (firstUnit !== undefined && unitKinds.every((unit) => units[unit] === 0)) {
    return err({ kind: 'InvalidUnitCount', unit: firstUnit, count: 0 })
  }
  return ok(undefined)
}
