import { fiefSeasonMark } from '@mygame/catalog'
import type { ResourceKind, SeasonKind } from '@mygame/contracts'
import { capitalize } from '../design-system/capitalize'
import { resourceNameOf } from '../resources/resourceNameOf'
import { neutralPercent } from './neutralPercent'
import { seasonNameOf } from './seasonNameOf'

const signedChange = (multiplierPercent: number): string => {
  const change = multiplierPercent - neutralPercent
  if (change === 0) {
    return '0'
  }
  return change > 0 ? `+${change}` : `-${-change}`
}

export function seasonMarkLineOf(
  season: SeasonKind,
  resource: ResourceKind,
  multiplierPercent: number,
): string {
  return fiefSeasonMark({
    season: capitalize(seasonNameOf(season)),
    change: signedChange(multiplierPercent),
    resource: resourceNameOf(resource),
  })
}
