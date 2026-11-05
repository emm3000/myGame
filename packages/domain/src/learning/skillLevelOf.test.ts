import { describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import type { TownSkill } from '../town/TownSkill'
import { skillLevelOf } from './skillLevelOf'

const earnedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-23T09:10:00Z'))

const earnedSkill = (lessonId: string, resource: TownSkill['resource']): TownSkill => ({
  lessonId,
  resource,
  ratePercent: 5,
  earnedAt,
})

describe('skillLevelOf', () => {
  it('stands at level 0 before any lesson earns the skill', () => {
    expect(skillLevelOf([], 'food')).toBe(0)
  })

  it('raises the skill one level per lesson that earned it', () => {
    const skills = [earnedSkill('lesson-1', 'food'), earnedSkill('lesson-2', 'food')]

    expect(skillLevelOf(skills, 'food')).toBe(2)
  })

  it('counts no lesson that earned the skill of another resource', () => {
    const skills = [earnedSkill('lesson-1', 'food'), earnedSkill('lesson-2', 'material')]

    expect(skillLevelOf(skills, 'food')).toBe(1)
  })
})
