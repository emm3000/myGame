import type { Hires } from './Hires'
import { kindsInTeamOf } from './kindsInTeamOf'
import type { SiteAddress } from './SiteAddress'
import type { TownCatalog } from './TownCatalog'

export const jobOneWaySeconds = (
  from: SiteAddress,
  to: SiteAddress,
  team: Hires,
  catalog: TownCatalog,
  seasonRoadPercent: number,
): number => {
  const { secondsPerArea, secondsPerSite } = catalog.townSettings().job
  const baseSeconds =
    Math.abs(to.area - from.area) * secondsPerArea + Math.abs(to.site - from.site) * secondsPerSite
  const teamRoadPercent = kindsInTeamOf(team).reduce(
    (slowest, hire) => Math.max(slowest, catalog.hireTermsOf(hire).roadPercent),
    0,
  )
  return Math.ceil((baseSeconds * teamRoadPercent * seasonRoadPercent) / 10_000)
}
