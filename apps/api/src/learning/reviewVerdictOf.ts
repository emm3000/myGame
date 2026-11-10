import type { RaisedSkill, ReviewVerdict } from '@mygame/contracts'
import {
  type DomainError,
  deriveResourceRates,
  dueInstantOf,
  type MemoryTerms,
  ok,
  type Result,
  skillLevelOf,
  type Town,
  type TownCatalog,
  type TownSkill,
} from '@mygame/domain'
import { isoOf } from '../http/isoOf'
import type { ReviewOutcome } from './answerReviewOf'

type RatesAtEarn = Pick<RaisedSkill, 'ratePerHourBefore' | 'ratePerHourAfter'>

const ratesAtEarnOf = (
  skill: TownSkill,
  skills: ReadonlyArray<TownSkill>,
  town: Town | undefined,
  catalog: TownCatalog,
): Result<RatesAtEarn, DomainError> => {
  if (town === undefined) {
    return ok({ ratePerHourBefore: null, ratePerHourAfter: null })
  }
  const ratesWith = (held: ReadonlyArray<TownSkill>) =>
    deriveResourceRates(town.buildingLevels, town.terrain, held, catalog, skill.earnedAt)
  const before = ratesWith(skills.filter(({ lessonId }) => lessonId !== skill.lessonId))
  if (!before.ok) {
    return before
  }
  const after = ratesWith(skills)
  if (!after.ok) {
    return after
  }
  return ok({
    ratePerHourBefore: before.value[skill.resource],
    ratePerHourAfter: after.value[skill.resource],
  })
}

const raisedSkillOf = (
  skill: TownSkill | undefined,
  { skills, town, skillWords }: ReviewOutcome,
  catalog: TownCatalog,
): Result<RaisedSkill | null, DomainError> => {
  if (skill === undefined) {
    return ok(null)
  }
  const rates = ratesAtEarnOf(skill, skills, town, catalog)
  if (!rates.ok) {
    return rates
  }
  return ok({
    lessonId: skill.lessonId,
    resource: skill.resource,
    ratePercent: skill.ratePercent,
    earnedAt: isoOf(skill.earnedAt),
    level: skillLevelOf(skills, skill.resource),
    ...rates.value,
    words: [...skillWords],
  })
}

export const reviewVerdictOf = (
  outcome: ReviewOutcome,
  catalog: TownCatalog,
  terms: MemoryTerms,
): Result<ReviewVerdict, DomainError> => {
  const { answered, word } = outcome
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
  const earnedSkill = raisedSkillOf(answered.earnedSkill, outcome, catalog)
  if (!earnedSkill.ok) {
    return earnedSkill
  }
  return ok({ ...shown, kind: 'correct', earnedSkill: earnedSkill.value })
}
