import type { HireKind } from '../../hiring/domain/HireKind'
import type { Hires } from '../../hiring/domain/Hires'
import { hireKinds } from '../../hiring/domain/hireKinds'

export const kindsInTeamOf = (team: Hires): ReadonlyArray<HireKind> =>
  hireKinds.filter((hire) => team[hire] > 0)
