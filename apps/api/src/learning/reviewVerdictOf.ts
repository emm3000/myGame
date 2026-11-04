import type { RaisedSkill, ReviewAnswer } from '@mygame/contracts'
import {
  type BuildingCatalog,
  type DomainError,
  deriveResourceRates,
  dueInstantOf,
  type EarnedSkill,
  type Fief,
  type MemoryTerms,
  ok,
  type Result,
  skillLevelOf,
} from '@mygame/domain'
import { isoOf } from '../http/isoOf'
import type { ReviewOutcome } from './answerReviewOf'

const raisedSkillOf = (
  skill: EarnedSkill | undefined,
  fief: Fief,
  catalog: BuildingCatalog,
): Result<RaisedSkill | null, DomainError> => {
  if (skill === undefined) {
    return ok(null)
  }
  const ratesWith = (skills: ReadonlyArray<EarnedSkill>) =>
    deriveResourceRates(
      fief.buildingLevels,
      fief.artLevels,
      skills,
      fief.terrain,
      catalog,
      skill.earnedAt,
    )
  const before = ratesWith(fief.skills.filter(({ lessonId }) => lessonId !== skill.lessonId))
  if (!before.ok) {
    return before
  }
  const after = ratesWith(fief.skills)
  if (!after.ok) {
    return after
  }
  return ok({
    lessonId: skill.lessonId,
    resource: skill.resource,
    ratePercent: skill.ratePercent,
    earnedAt: isoOf(skill.earnedAt),
    level: skillLevelOf(fief.skills, skill.resource),
    ratePerHourBefore: before.value[skill.resource],
    ratePerHourAfter: after.value[skill.resource],
  })
}

export const reviewVerdictOf = (
  { answered, word, reading }: ReviewOutcome,
  catalog: BuildingCatalog,
  terms: MemoryTerms,
): Result<ReviewAnswer['verdict'], DomainError> => {
  if (answered.kind === 'nearMiss') {
    return ok({ kind: 'nearMiss' })
  }
  const dueAt = dueInstantOf(answered.card, terms)
  if (!dueAt.ok) {
    return dueAt
  }
  const shown = { word: word.acceptedForms[0], gloss: word.gloss, dueAt: isoOf(dueAt.value) }
  if (answered.rating === 'again') {
    return ok({ ...shown, kind: 'wrong' })
  }
  const earnedSkill = raisedSkillOf(answered.earnedSkill, reading.fief, catalog)
  if (!earnedSkill.ok) {
    return earnedSkill
  }
  return ok({ ...shown, kind: 'correct', earnedSkill: earnedSkill.value })
}
