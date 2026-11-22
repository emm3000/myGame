import type { Hires } from '../../hiring/domain/Hires'
import { hireKinds } from '../../hiring/domain/hireKinds'

export const headsOf = (team: Hires): number =>
  hireKinds.reduce((heads, hire) => heads + team[hire], 0)
