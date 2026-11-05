import { fiefPeasantsCostName, fiefShortMark } from '@mygame/catalog'
import type { CardCost } from '../design-system/CostList'

export function peasantCostOf(amount: number, isShort: boolean): CardCost {
  return {
    kind: 'peasants',
    amount,
    spokenName: fiefPeasantsCostName({ count: amount }),
    shortMark: isShort ? fiefShortMark() : undefined,
  }
}
