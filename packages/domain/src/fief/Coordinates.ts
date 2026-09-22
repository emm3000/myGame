import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'

const isPositiveWholeNumber = (value: number): boolean => Number.isInteger(value) && value > 0

export class Coordinates {
  private constructor(
    readonly kingdom: number,
    readonly province: number,
    readonly plot: number,
  ) {}

  static create(kingdom: number, province: number, plot: number): Result<Coordinates, DomainError> {
    if (![kingdom, province, plot].every(isPositiveWholeNumber)) {
      return err({ kind: 'InvalidCoordinates', kingdom, province, plot })
    }
    return ok(new Coordinates(kingdom, province, plot))
  }
}
