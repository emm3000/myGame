import {
  type DomainError,
  deriveResourceRates,
  dueInstantOf,
  glossOf,
  type Instant,
  type MemoryTerms,
  ok,
  type Result,
  type ReviewOutcome,
  skillLevelOf,
  type Town,
  type TownCatalog,
  type TownSkill,
} from '@mygame/domain'

type RatesAtEarn = {
  readonly ratePerHourBefore: number | null
  readonly ratePerHourAfter: number | null
}

export type EarnedSkillView = RatesAtEarn & {
  readonly skill: TownSkill
  readonly level: number
  readonly words: ReadonlyArray<string>
}

type ShownWord = {
  readonly word: string
  readonly gloss: string
  readonly dueAt: Instant
  readonly stableWordCount: number
  readonly retainedWordCount: number
  readonly openedLevel: number | null
}

export type ReviewVerdictView =
  | { readonly kind: 'nearMiss' }
  | (ShownWord & { readonly kind: 'wrong' })
  | (ShownWord & { readonly kind: 'correct'; readonly earnedSkill: EarnedSkillView | null })

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

const earnedSkillViewOf = (
  skill: TownSkill | undefined,
  { skills, town, skillWords }: ReviewOutcome,
  catalog: TownCatalog,
): Result<EarnedSkillView | null, DomainError> => {
  if (skill === undefined) {
    return ok(null)
  }
  const rates = ratesAtEarnOf(skill, skills, town, catalog)
  if (!rates.ok) {
    return rates
  }
  return ok({
    skill,
    level: skillLevelOf(skills, skill.resource),
    ...rates.value,
    words: skillWords,
  })
}

export const gatherReviewVerdict = (
  outcome: ReviewOutcome,
  catalog: TownCatalog,
  terms: MemoryTerms,
): Result<ReviewVerdictView, DomainError> => {
  const { answered, word, scaffold } = outcome
  if (answered.kind === 'nearMiss') {
    return ok({ kind: 'nearMiss' })
  }
  const dueAt = dueInstantOf(answered.card, terms)
  if (!dueAt.ok) {
    return dueAt
  }
  const shown = {
    word: word.acceptedForms[0],
    gloss: glossOf(word, scaffold),
    dueAt: dueAt.value,
    stableWordCount: answered.stableWordCount,
    retainedWordCount: answered.retainedWordCount,
    openedLevel: answered.openedLevel,
  }
  if (answered.rating === 'again') {
    return ok({ ...shown, kind: 'wrong' })
  }
  const earnedSkill = earnedSkillViewOf(answered.earnedSkill, outcome, catalog)
  if (!earnedSkill.ok) {
    return earnedSkill
  }
  return ok({ ...shown, kind: 'correct', earnedSkill: earnedSkill.value })
}
