import type { RegionMap } from '@mygame/contracts'

export type WasteSize = NonNullable<RegionMap['sites'][number]['waste']>['size']
