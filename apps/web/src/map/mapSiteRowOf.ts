import {
  mapCleanUpAction,
  mapCleanUpActionTo,
  mapFree,
  mapOwnTown,
  mapSendTeam,
  mapSendTeamTo,
  mapSite,
  mapWasteAmount,
  mapWasteSize,
} from '@mygame/catalog'
import type { RegionMap } from '@mygame/contracts'
import type { WasteSize } from '../design-system/WasteSize'

type RegionSite = RegionMap['sites'][number]

interface SiteRowHeader {
  readonly site: number
  readonly label: string
}

interface SiteRowAction {
  readonly actionLabel: string
  readonly actionName: string
}

export type MapSiteRow =
  | (SiteRowHeader & SiteRowAction & { readonly kind: 'free'; readonly line: string })
  | (SiteRowHeader &
      SiteRowAction & {
        readonly kind: 'waste'
        readonly size: WasteSize
        readonly sizeLine: string
        readonly wasteLine: string
      })
  | (SiteRowHeader & { readonly kind: 'town'; readonly name: string })
  | (SiteRowHeader & { readonly kind: 'own'; readonly name: string; readonly line: string })

export function mapSiteRowOf({ site, town, waste }: RegionSite): MapSiteRow {
  const header = { site, label: mapSite({ site }) }
  if (town !== null) {
    return town.isOwn
      ? { ...header, kind: 'own', name: town.name, line: mapOwnTown() }
      : { ...header, kind: 'town', name: town.name }
  }
  if (waste !== null) {
    return {
      ...header,
      kind: 'waste',
      size: waste.size,
      sizeLine: mapWasteSize({ size: waste.size }),
      wasteLine: mapWasteAmount({ waste: waste.waste }),
      actionLabel: mapCleanUpAction(),
      actionName: mapCleanUpActionTo({ site }),
    }
  }
  return {
    ...header,
    kind: 'free',
    line: mapFree(),
    actionLabel: mapSendTeam(),
    actionName: mapSendTeamTo({ site }),
  }
}
