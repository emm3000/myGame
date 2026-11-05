import { fiefTooExpensive } from '@mygame/catalog'
import { quantitiesPhraseOf } from '../resources/quantitiesPhraseOf'
import type { ResourceQuantity } from '../resources/ResourceQuantity'

const agreementCountOf = (shortfalls: ReadonlyArray<ResourceQuantity>): number =>
  shortfalls.length === 1 ? (shortfalls[0]?.amount ?? 0) : shortfalls.length

export function tooExpensiveLineOf(shortfalls: ReadonlyArray<ResourceQuantity>): string {
  return fiefTooExpensive({
    count: agreementCountOf(shortfalls),
    quantities: quantitiesPhraseOf(shortfalls),
  })
}
