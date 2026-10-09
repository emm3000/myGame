import {
  BuildingKindSchema,
  type HintKind,
  HintKindSchema,
  ResourceKindSchema,
} from '@mygame/contracts'
import { fullStoreOf } from '../fief/fullStoreOf'
import { isBlockedByPeasants } from '../fief/isBlockedByPeasants'
import type { LiveFief } from '../fief/liveFief'
import { neutralPercent } from '../seasons/neutralPercent'
import type { ShownHint } from './ShownHint'

type FiefHintKind = Exclude<HintKind, 'marches'>

export type FiefHint = Extract<ShownHint, { readonly kind: FiefHintKind }>

const onlyWhen = (holds: boolean, hint: FiefHint): FiefHint | undefined =>
  holds ? hint : undefined

const triggers: Readonly<Record<FiefHintKind, (fief: LiveFief) => FiefHint | undefined>> = {
  peasants: ({ overview }) =>
    onlyWhen(
      BuildingKindSchema.options.some((building) => isBlockedByPeasants(building, overview)),
      { kind: 'peasants' },
    ),
  seasons: ({ overview: { season } }) =>
    season !== null &&
    ResourceKindSchema.options.some(
      (resource) => season.multiplierPercent[resource] !== neutralPercent,
    )
      ? { kind: 'seasons', season: season.kind }
      : undefined,
  queue: ({ overview }) => onlyWhen(overview.slot.kind === 'busy', { kind: 'queue' }),
  library: ({ overview }) => onlyWhen(overview.buildings.library.level === 1, { kind: 'library' }),
  barracks: ({ overview }) =>
    onlyWhen(overview.buildings.barracks.level === 1, { kind: 'barracks' }),
  fullStore: (fief) => {
    const resource = fullStoreOf(fief)
    return resource === undefined ? undefined : { kind: 'fullStore', resource }
  },
}

const fiefHintKinds = HintKindSchema.options.filter(
  (hint): hint is FiefHintKind => hint !== 'marches',
)

export function fiefHintOf(fief: LiveFief, hidden: ReadonlySet<HintKind>): FiefHint | undefined {
  for (const hint of fiefHintKinds) {
    const shown = hidden.has(hint) ? undefined : triggers[hint](fief)
    if (shown !== undefined) {
      return shown
    }
  }
  return undefined
}
