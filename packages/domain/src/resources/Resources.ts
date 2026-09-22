import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'

export type ResourceKind = 'wood' | 'stone' | 'iron' | 'gold' | 'food'

export class Resource {
  private constructor(
    readonly amount: number,
    readonly ratePerHour: number,
    readonly capacityUnits: number,
  ) {}

  static create(
    amount: number,
    ratePerHour: number,
    capacityUnits: number,
  ): Result<Resource, DomainError> {
    if (amount < 0) {
      return err({ kind: 'NegativeResourceAmount', amount })
    }
    if (ratePerHour < 0) {
      return err({ kind: 'NegativeResourceRate', ratePerHour })
    }
    return ok(new Resource(amount, ratePerHour, capacityUnits))
  }

  withAccruedAmount(amount: number): Resource {
    return new Resource(amount, this.ratePerHour, this.capacityUnits)
  }
}

export type Resources = Readonly<Record<ResourceKind, Resource>>
