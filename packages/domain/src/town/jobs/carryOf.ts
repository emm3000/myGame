import type { TownCatalog } from '../domain/TownCatalog'
import type { Hires } from '../hiring/Hires'
import { hireKinds } from '../hiring/hireKinds'

export const carryOf = (team: Hires, catalog: TownCatalog): number =>
  hireKinds.reduce((total, hire) => total + team[hire] * catalog.hireTermsOf(hire).carry, 0)
