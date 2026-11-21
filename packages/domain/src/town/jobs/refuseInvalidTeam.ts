import type { DomainError } from '../../DomainError'
import type { Hires } from '../hiring/Hires'
import { hireKinds } from '../hiring/hireKinds'
import { headsOf } from './headsOf'

const isWholeFromZero = (value: number): boolean => Number.isInteger(value) && value >= 0

export const refuseInvalidTeam = (team: Hires): DomainError | undefined =>
  hireKinds.every((hire) => isWholeFromZero(team[hire])) && headsOf(team) >= 1
    ? undefined
    : { kind: 'InvalidTeam', team }
