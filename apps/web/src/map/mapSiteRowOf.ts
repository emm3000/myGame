import { mapFree, mapOwnTown, mapSendTeam, mapSendTeamTo, mapSite } from '@mygame/catalog'
import type { RegionMap } from '@mygame/contracts'

type RegionSite = RegionMap['sites'][number]

interface SiteRowHeader {
  readonly site: number
  readonly label: string
}

export type MapSiteRow =
  | (SiteRowHeader & {
      readonly kind: 'free'
      readonly line: string
      readonly actionLabel: string
      readonly actionName: string
    })
  | (SiteRowHeader & { readonly kind: 'town'; readonly name: string })
  | (SiteRowHeader & { readonly kind: 'own'; readonly name: string; readonly line: string })

export function mapSiteRowOf({ site, town }: RegionSite): MapSiteRow {
  const header = { site, label: mapSite({ site }) }
  if (town === null) {
    return {
      ...header,
      kind: 'free',
      line: mapFree(),
      actionLabel: mapSendTeam(),
      actionName: mapSendTeamTo({ site }),
    }
  }
  return town.isOwn
    ? { ...header, kind: 'own', name: town.name, line: mapOwnTown() }
    : { ...header, kind: 'town', name: town.name }
}
