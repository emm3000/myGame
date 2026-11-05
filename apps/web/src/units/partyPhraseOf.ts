import { UnitKindSchema } from '@mygame/contracts'
import { conjunctionOf } from '../design-system/conjunctionOf'
import { countedUnitsOf } from './countedUnitsOf'
import { listedUnitsOf } from './listedUnitsOf'
import type { UnitCounts } from './UnitCounts'

const noOneOfTheFirstKind = (): string =>
  UnitKindSchema.options
    .slice(0, 1)
    .map((unit) => countedUnitsOf(unit, 0))
    .join('')

export function partyPhraseOf(counts: UnitCounts): string {
  const listed = listedUnitsOf(counts)
  return listed.length === 0 ? noOneOfTheFirstKind() : conjunctionOf(listed)
}
