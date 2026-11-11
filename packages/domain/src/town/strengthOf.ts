import type { Hires } from './Hires'
import { hireKinds } from './hireKinds'
import type { TownCatalog } from './TownCatalog'

export const strengthOf = (team: Hires, catalog: TownCatalog): number =>
  hireKinds.reduce((total, hire) => total + team[hire] * catalog.hireTermsOf(hire).strength, 0)
