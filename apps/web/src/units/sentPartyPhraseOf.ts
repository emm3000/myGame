import { UnitKindSchema } from '@mygame/contracts'
import { conjunctionOf } from '../design-system/conjunctionOf'
import { countedUnitsOf } from './countedUnitsOf'
import { listedUnitsOf } from './listedUnitsOf'
import type { UnitCounts } from './UnitCounts'

export function sentPartyPhraseOf(counts: UnitCounts, sent: UnitCounts): string {
  const listed = listedUnitsOf(counts)
  return listed.length > 0
    ? conjunctionOf(listed)
    : conjunctionOf(
        UnitKindSchema.options
          .filter((unit) => sent[unit] > 0)
          .map((unit) => countedUnitsOf(unit, 0)),
      )
}
