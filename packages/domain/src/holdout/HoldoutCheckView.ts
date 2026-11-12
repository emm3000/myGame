import type { Band } from '../learning/BandStart'
import type { PlacementItem } from '../placement/PlacementView'
import type { HoldoutCheckWeek } from './HoldoutCheck'

export type HoldoutCheckView =
  | { readonly kind: 'due'; readonly band: Band; readonly week: HoldoutCheckWeek }
  | {
      readonly kind: 'asking'
      readonly band: Band
      readonly week: HoldoutCheckWeek
      readonly items: ReadonlyArray<PlacementItem>
    }
