import { Instant, type PlayerId } from '@mygame/domain'
import type { EarnedSkillRepository, TownSkill } from '@mygame/domain/town'
import { describe, expect, it } from 'vitest'

export type EarnedSkillRepositoryFixture = {
  readonly skills: EarnedSkillRepository
  readonly registerPlayers: (playerIds: ReadonlyArray<PlayerId>) => Promise<void>
}

const ana = '00000000-0000-4000-8000-000000000001'
const bruno = '00000000-0000-4000-8000-000000000002'

const foodSkill: TownSkill = {
  lessonId: 'lesson-1',
  resource: 'food',
  ratePercent: 5,
  earnedAt: Instant.fromEpochMilliseconds(Date.parse('2026-11-23T09:10:00Z')),
}

const materialSkill: TownSkill = {
  lessonId: 'lesson-2',
  resource: 'material',
  ratePercent: 5,
  earnedAt: Instant.fromEpochMilliseconds(Date.parse('2026-11-30T09:10:00Z')),
}

export const earnedSkillRepositoryContract = (
  adapterName: string,
  arrange: () => Promise<EarnedSkillRepositoryFixture>,
): void => {
  describe(`${adapterName} as an EarnedSkillRepository`, () => {
    it('answers no skill for a player who earned none', async () => {
      const { skills, registerPlayers } = await arrange()
      await registerPlayers([ana])

      expect(await skills.skillsOf(ana)).toEqual({ ok: true, value: [] })
    })

    it('reads back the skills a player earned in the order they were earned', async () => {
      const { skills, registerPlayers } = await arrange()
      await registerPlayers([ana])

      await skills.save(ana, materialSkill)
      await skills.save(ana, foodSkill)

      expect(await skills.skillsOf(ana)).toEqual({ ok: true, value: [foodSkill, materialSkill] })
    })

    it('keeps the first earn of a lesson saved twice', async () => {
      const { skills, registerPlayers } = await arrange()
      await registerPlayers([ana])
      await skills.save(ana, foodSkill)

      await skills.save(ana, { ...foodSkill, earnedAt: materialSkill.earnedAt })

      expect(await skills.skillsOf(ana)).toEqual({ ok: true, value: [foodSkill] })
    })

    it('keeps the skills of one player from another', async () => {
      const { skills, registerPlayers } = await arrange()
      await registerPlayers([ana, bruno])

      await skills.save(ana, foodSkill)

      expect(await skills.skillsOf(bruno)).toEqual({ ok: true, value: [] })
    })
  })
}
