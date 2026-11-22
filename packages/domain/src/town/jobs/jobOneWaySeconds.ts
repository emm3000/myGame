import type { SiteAddress } from '../domain/SiteAddress'
import type { TownCatalog } from '../domain/TownCatalog'
import type { Hires } from '../hiring/Hires'
import { kindsInTeamOf } from './kindsInTeamOf'

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
