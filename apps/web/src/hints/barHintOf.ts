import type { HintKind } from '@mygame/contracts'
import type { LiveFief } from '../fief/liveFief'
import { type FiefHint, fiefHintOf } from './fiefHintOf'

export type BarHint = Extract<FiefHint, { readonly kind: 'peasants' | 'fullStore' }>

export function barHintOf(fief: LiveFief, hidden: ReadonlySet<HintKind>): BarHint | undefined {
  const hint = fiefHintOf(fief, hidden)
  return hint?.kind === 'peasants' || hint?.kind === 'fullStore' ? hint : undefined
}
