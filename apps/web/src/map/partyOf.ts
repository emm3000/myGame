import type { UnitKind } from '@mygame/contracts'
import { UnitKindSchema } from '@mygame/contracts'
import { byUnitKind } from './byUnitKind'
import type { UnitCounts } from './unitsAtHomeOf'

export type PartyEntries = Readonly<Record<UnitKind, string>>

const wholeCountPattern = /^[0-9]+$/

const countOf = (entry: string): number | undefined => {
  if (entry === '') {
    return 0
  }
  return wholeCountPattern.test(entry) ? Number(entry) : undefined
}

export function partyOf(entries: PartyEntries): UnitCounts | undefined {
  const isWhole = UnitKindSchema.options.every((unit) => countOf(entries[unit]) !== undefined)
  return isWhole ? byUnitKind((unit) => countOf(entries[unit]) ?? 0) : undefined
}
