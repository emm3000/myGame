import { namesAddress } from '@mygame/catalog'
import type { FiefOverview } from '@mygame/contracts'
import { kingdomNameOf } from './kingdomNameOf'

export function addressOf({ kingdom, province, plot }: FiefOverview['coordinates']): string {
  return namesAddress({ kingdom: kingdomNameOf(kingdom), province, plot })
}
