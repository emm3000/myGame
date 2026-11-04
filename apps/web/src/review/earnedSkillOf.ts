import type { FiefOverview, ResourceKind } from '@mygame/contracts'
import type { RatedVerdict } from './useReview'

export interface EarnedSkill {
  readonly resource: ResourceKind
  readonly level: number
  readonly ratePercent: number
}

export function earnedSkillOf(
  verdict: RatedVerdict,
  skills: FiefOverview['skills'],
): EarnedSkill | undefined {
  if (verdict.kind !== 'correct' || verdict.earnedSkill === null) {
    return undefined
  }
  const { resource, ratePercent } = verdict.earnedSkill
  const level = skills.filter((skill) => skill.resource === resource).length
  return { resource, level, ratePercent }
}
