import type { DomainError } from '../DomainError'
import type { UnitKind } from '../ports/BuildingCatalog'
import { err, ok, type Result } from '../Result'
import { unitKinds } from './unitKinds'

export type UnitCountsByKind = Readonly<Record<UnitKind, number>>

const isWholeCount = (count: number): boolean => Number.isInteger(count) && count >= 0

export class FiefUnitCounts {
  static readonly none: FiefUnitCounts = new FiefUnitCounts({ infantry: 0 })

  private constructor(private readonly byKind: UnitCountsByKind) {}

  static create(byKind: UnitCountsByKind): Result<FiefUnitCounts, DomainError> {
    const invalidUnit = unitKinds.find((unit) => !isWholeCount(byKind[unit]))
    if (invalidUnit !== undefined) {
      return err({ kind: 'InvalidUnitCount', unit: invalidUnit, count: byKind[invalidUnit] })
    }
    return ok(new FiefUnitCounts(byKind))
  }

  countOf(unit: UnitKind): number {
    return this.byKind[unit]
  }
}
