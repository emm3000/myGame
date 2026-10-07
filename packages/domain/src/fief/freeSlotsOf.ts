import type { Fief } from './Fief'
import type { FiefSlotKind } from './FiefSlotKind'

export const freeSlotsOf = (fief: Fief): ReadonlyArray<FiefSlotKind> => {
  const hasLibrary = fief.buildingLevels.library >= 1
  const hasBarracks = fief.buildingLevels.barracks >= 1
  const slots: ReadonlyArray<[FiefSlotKind, boolean]> = [
    ['build', fief.slot.kind === 'idle'],
    ['study', hasLibrary && fief.studySlot.kind === 'idle'],
    ['recruit', hasBarracks && fief.recruitOrder.kind === 'idle'],
    ['march', hasBarracks && fief.march.kind === 'idle'],
  ]
  return slots.filter(([, isFree]) => isFree).map(([slot]) => slot)
}
