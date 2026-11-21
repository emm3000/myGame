import type { RegionMap } from '@mygame/contracts'
import type { PlayerCopy } from '../copy/PlayerCopy'
import type { Label } from '../design-system/Label'
import type { WasteSize } from '../design-system/WasteSize'

type RegionSite = RegionMap['sites'][number]

interface SiteRowHeader {
  readonly site: number
  readonly label: Label
}

interface SiteRowAction {
  readonly actionLabel: Label
  readonly actionName: Label
}

export type MapSiteRow =
  | (SiteRowHeader & SiteRowAction & { readonly kind: 'free'; readonly line: Label })
  | (SiteRowHeader &
      SiteRowAction & {
        readonly kind: 'waste'
        readonly size: WasteSize
        readonly sizeLine: Label
        readonly wasteLine: Label
      })
  | (SiteRowHeader & { readonly kind: 'town'; readonly name: string })
  | (SiteRowHeader & { readonly kind: 'own'; readonly name: string; readonly line: Label })

export function mapSiteRowOf({ site, town, waste }: RegionSite, copy: PlayerCopy): MapSiteRow {
  const header = { site, label: copy.chrome((catalog) => catalog.mapSite({ site })) }
  if (town !== null) {
    return town.isOwn
      ? {
          ...header,
          kind: 'own',
          name: town.name,
          line: copy.chrome((catalog) => catalog.mapOwnTown()),
        }
      : { ...header, kind: 'town', name: town.name }
  }
  if (waste !== null) {
    return {
      ...header,
      kind: 'waste',
      size: waste.size,
      sizeLine: copy.chrome((catalog) => catalog.mapWasteSize({ size: waste.size })),
      wasteLine: copy.chrome((catalog) => catalog.mapWasteAmount({ waste: waste.waste })),
      actionLabel: copy.chrome((catalog) => catalog.mapCleanUpAction()),
      actionName: copy.chrome((catalog) => catalog.mapCleanUpActionTo({ site })),
    }
  }
  return {
    ...header,
    kind: 'free',
    line: copy.chrome((catalog) => catalog.mapFree()),
    actionLabel: copy.chrome((catalog) => catalog.mapSendTeam()),
    actionName: copy.chrome((catalog) => catalog.mapSendTeamTo({ site })),
  }
}
