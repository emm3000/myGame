import type { Hires } from './Hires'
import { hireKinds } from './hireKinds'
import type { TownCatalog } from './TownCatalog'

export const carryOf = (team: Hires, catalog: TownCatalog): number =>
  hireKinds.reduce((total, hire) => total + team[hire] * catalog.hireTermsOf(hire).carry, 0)
