import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'

const isPositiveWholeNumber = (value: number): boolean => Number.isInteger(value) && value > 0

export class TownAddress {
  private constructor(
    readonly region: number,
    readonly area: number,
    readonly site: number,
  ) {}

  static create(region: number, area: number, site: number): Result<TownAddress, DomainError> {
    if (![region, area, site].every(isPositiveWholeNumber)) {
      return err({ kind: 'InvalidTownAddress', region, area, site })
    }
    return ok(new TownAddress(region, area, site))
  }
}
