import { type FiefOverview, type HintKind, UnitKindSchema } from '@mygame/contracts'
import { unitsAtHomeOf } from '../map/unitsAtHomeOf'
import type { ShownHint } from './ShownHint'

export function marchesHintOf(
  overview: FiefOverview,
  hidden: ReadonlySet<HintKind>,
): ShownHint | undefined {
  const atHome = unitsAtHomeOf(overview)
  const hasUnitsAtHome = UnitKindSchema.options.some((unit) => atHome[unit] > 0)
  return !hidden.has('marches') && hasUnitsAtHome ? { kind: 'marches' } : undefined
}
