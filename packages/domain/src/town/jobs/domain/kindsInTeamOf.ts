import type { HireKind } from '../../hiring/HireKind'
import type { Hires } from '../../hiring/Hires'
import { hireKinds } from '../../hiring/hireKinds'

export const kindsInTeamOf = (team: Hires): ReadonlyArray<HireKind> =>
  hireKinds.filter((hire) => team[hire] > 0)
