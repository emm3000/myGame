import { type ResourceAmounts, type ResourceKind, ResourceKindSchema } from '@mygame/contracts'
import { wholeCountOf } from './wholeCountOf'

export type CargoEntries = Readonly<Record<ResourceKind, string>>

export function cargoOf(entries: CargoEntries): ResourceAmounts | undefined {
  const isWhole = ResourceKindSchema.options.every(
    (resource) => wholeCountOf(entries[resource]) !== undefined,
  )
  if (!isWhole) {
    return undefined
  }
  const amountOf = (resource: ResourceKind): number => wholeCountOf(entries[resource]) ?? 0
  return {
    wood: amountOf('wood'),
    stone: amountOf('stone'),
    iron: amountOf('iron'),
    gold: amountOf('gold'),
    food: amountOf('food'),
  }
}
