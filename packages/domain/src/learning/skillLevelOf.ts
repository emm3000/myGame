import type { ResourceKind } from '../resources/Resources'
import type { EarnedSkill } from './EarnedSkill'

export const skillLevelOf = (skills: ReadonlyArray<EarnedSkill>, resource: ResourceKind): number =>
  skills.filter((skill) => skill.resource === resource).length
