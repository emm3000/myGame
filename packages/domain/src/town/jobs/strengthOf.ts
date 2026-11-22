import type { TownCatalog } from '../domain/TownCatalog'
import type { Hires } from '../hiring/Hires'
import { hireKinds } from '../hiring/hireKinds'

export const strengthOf = (team: Hires, catalog: TownCatalog): number =>
  hireKinds.reduce((total, hire) => total + team[hire] * catalog.hireTermsOf(hire).strength, 0)
