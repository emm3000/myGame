import { describe, expect, it } from 'vitest'
import { Instant } from '../time/Instant'
import type { TownSkill } from '../town/TownSkill'
import { inMemoryEarnedSkills } from './inMemoryEarnedSkills'

const foodSkill: TownSkill = {
  lessonId: 'lesson-1',
  resource: 'food',
  ratePercent: 5,
  earnedAt: Instant.fromEpochMilliseconds(Date.parse('2026-11-23T09:10:00Z')),
}

describe('inMemoryEarnedSkills', () => {
  it('keeps the first earn of a lesson saved twice', async () => {
    const skills = inMemoryEarnedSkills([])
    await skills.save('learner', foodSkill)

    await skills.save('learner', {
      ...foodSkill,
      earnedAt: Instant.fromEpochMilliseconds(Date.parse('2026-11-30T09:10:00Z')),
    })

    expect(await skills.skillsOf('learner')).toEqual({ ok: true, value: [foodSkill] })
  })
})
