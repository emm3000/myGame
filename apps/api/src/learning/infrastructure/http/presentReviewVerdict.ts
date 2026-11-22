import type { RaisedSkill, ReviewVerdict } from '@mygame/contracts'
import { isoOf } from '#platform/infrastructure/http/isoOf'
import type { EarnedSkillView, ReviewVerdictView } from './gatherReviewVerdict'

const presentRaisedSkill = ({
  skill,
  level,
  ratePerHourBefore,
  ratePerHourAfter,
  words,
}: EarnedSkillView): RaisedSkill => ({
  lessonId: skill.lessonId,
  resource: skill.resource,
  ratePercent: skill.ratePercent,
  earnedAt: isoOf(skill.earnedAt),
  level,
  ratePerHourBefore,
  ratePerHourAfter,
  words: [...words],
})

export const presentReviewVerdict = (view: ReviewVerdictView): ReviewVerdict => {
  if (view.kind === 'nearMiss') {
    return { kind: 'nearMiss' }
  }
  const shown = {
    word: view.word,
    gloss: view.gloss,
    dueAt: isoOf(view.dueAt),
    stableWordCount: view.stableWordCount,
    retainedWordCount: view.retainedWordCount,
    openedLevel: view.openedLevel,
  }
  if (view.kind === 'wrong') {
    return { ...shown, kind: 'wrong' }
  }
  return {
    ...shown,
    kind: 'correct',
    earnedSkill: view.earnedSkill === null ? null : presentRaisedSkill(view.earnedSkill),
  }
}
