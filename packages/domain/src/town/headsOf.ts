import type { Hires } from './Hires'
import { hireKinds } from './hireKinds'

export const headsOf = (team: Hires): number =>
  hireKinds.reduce((heads, hire) => heads + team[hire], 0)
