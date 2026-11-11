import type { HireKind } from './HireKind'
import type { Hires } from './Hires'
import { hireKinds } from './hireKinds'

export const kindsInTeamOf = (team: Hires): ReadonlyArray<HireKind> =>
  hireKinds.filter((hire) => team[hire] > 0)
