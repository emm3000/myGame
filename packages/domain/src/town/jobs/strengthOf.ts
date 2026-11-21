import type { Hires } from '../hiring/Hires'
import { hireKinds } from '../hiring/hireKinds'
import type { TownCatalog } from '../ports/TownCatalog'

export const strengthOf = (team: Hires, catalog: TownCatalog): number =>
  hireKinds.reduce((total, hire) => total + team[hire] * catalog.hireTermsOf(hire).strength, 0)
