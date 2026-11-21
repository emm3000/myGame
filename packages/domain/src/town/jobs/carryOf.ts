import type { Hires } from '../hiring/Hires'
import { hireKinds } from '../hiring/hireKinds'
import type { TownCatalog } from '../ports/TownCatalog'

export const carryOf = (team: Hires, catalog: TownCatalog): number =>
  hireKinds.reduce((total, hire) => total + team[hire] * catalog.hireTermsOf(hire).carry, 0)
