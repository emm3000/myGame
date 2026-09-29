import type { FiefOverview } from '@mygame/contracts'

export function infantryAtHomeOf(fief: FiefOverview): number {
  return fief.units.infantry - (fief.march?.infantry ?? 0)
}
