import type { Instant } from '../time/Instant'
import { cleanUpPayOf } from './cleanUpPayOf'
import { coversWaste } from './coversWaste'
import type { Hires } from './Hires'
import type { CleanUpJob } from './Job'
import { jobOneWaySeconds } from './jobOneWaySeconds'
import { jobSeasonAt } from './jobSeasonAt'
import type { SiteAddress } from './SiteAddress'
import { unchangedProductionPercent } from './seasonPercentsAt'
import { strengthOf } from './strengthOf'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { WasteSize } from './WasteSize'

const noPay = { money: 0, food: 0, power: 0, material: 0 }

export type WasteAtDispatch = {
  readonly size: WasteSize
  readonly waste: number
}

export const cleanUpJobOf = (
  town: Town,
  site: SiteAddress,
  team: Hires,
  { size, waste }: WasteAtDispatch,
  catalog: TownCatalog,
  now: Instant,
): CleanUpJob => {
  const strength = strengthOf(team, catalog)
  const { roadPercent } = jobSeasonAt(now, catalog.townSettings())
  return {
    kind: 'out',
    site,
    team,
    hours: 0,
    sentAt: now,
    oneWaySeconds: jobOneWaySeconds(town.address, site, team, catalog, roadPercent),
    pay: coversWaste({ strength, waste }) ? cleanUpPayOf(waste, team, catalog) : noPay,
    payPercent: unchangedProductionPercent,
    cleanUp: { size, waste, strength, hasArrived: false },
  }
}
