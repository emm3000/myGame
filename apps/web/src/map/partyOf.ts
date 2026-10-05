import type { UnitKind } from '@mygame/contracts'
import { partyKinds } from '../units/partyKinds'
import type { UnitCounts } from '../units/UnitCounts'
import { byUnitKind } from './byUnitKind'
import { wholeCountOf } from './wholeCountOf'

export type PartyEntries = Readonly<Record<UnitKind, string>>

export function partyOf(entries: PartyEntries): UnitCounts | undefined {
  const isWhole = partyKinds.every((unit) => wholeCountOf(entries[unit]) !== undefined)
  return isWhole ? byUnitKind((unit) => wholeCountOf(entries[unit]) ?? 0) : undefined
}
