import type { Hires } from '../../hiring/Hires'
import { hireKinds } from '../../hiring/hireKinds'

export const headsOf = (team: Hires): number =>
  hireKinds.reduce((heads, hire) => heads + team[hire], 0)
