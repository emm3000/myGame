import type { PlayerId } from '../player/PlayerId'
import { ok } from '../Result'
import type { EarnedSkillRepository } from '../town/EarnedSkillRepository'
import type { TownSkill } from '../town/TownSkill'

export type PlayerSkill = {
  readonly playerId: PlayerId
  readonly skill: TownSkill
}

export const inMemoryEarnedSkills = (
  existing: ReadonlyArray<PlayerSkill>,
): EarnedSkillRepository => {
  const skills = [...existing]
  return {
    skillsOf: async (playerId) =>
      ok(skills.filter((stored) => stored.playerId === playerId).map(({ skill }) => skill)),
    save: async (playerId, skill) => {
      skills.push({ playerId, skill })
      return ok(undefined)
    },
  }
}
