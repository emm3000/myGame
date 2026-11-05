import type { ResourceKind } from '@mygame/contracts'

export interface ResourceQuantity {
  readonly amount: number
  readonly resource: ResourceKind
}
