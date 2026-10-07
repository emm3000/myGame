import { copy } from '../copy'
import type { CardCost } from '../design-system/CostList'

export function peasantCostOf(amount: number, isShort: boolean): CardCost {
  return {
    kind: 'peasants',
    amount,
    spokenName: copy.fief.peasantsCostName(amount),
    shortMark: isShort ? copy.fief.shortMark : undefined,
  }
}
