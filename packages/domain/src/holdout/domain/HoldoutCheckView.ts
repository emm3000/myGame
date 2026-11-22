import type { Band } from '#learning/curriculum/domain/Band'
import type { PlacementItem } from '#placement/domain/PlacementView'
import type { HoldoutCheckWeek } from './HoldoutCheckWeek'

export type HoldoutCheckView =
  | { readonly kind: 'due'; readonly band: Band; readonly week: HoldoutCheckWeek }
  | {
      readonly kind: 'asking'
      readonly band: Band
      readonly week: HoldoutCheckWeek
      readonly items: ReadonlyArray<PlacementItem>
    }
