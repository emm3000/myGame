import type { PlayerId } from '#player/PlayerId'
import { ok } from '#Result'
import type { EarnedSkillRepository } from '../ports/EarnedSkillRepository'
import type { TownSkill } from '../TownSkill'

export type PlayerSkill = {
  readonly playerId: PlayerId
  readonly skill: TownSkill
}

const byEarnedAt = (left: TownSkill, right: TownSkill): number =>
  left.earnedAt.epochMilliseconds - right.earnedAt.epochMilliseconds ||
  (left.lessonId < right.lessonId ? -1 : Number(left.lessonId > right.lessonId))

export const inMemoryEarnedSkills = (
  existing: ReadonlyArray<PlayerSkill>,
): EarnedSkillRepository => {
  const skills = [...existing]
  return {
    skillsOf: async (playerId) =>
      ok(
        skills
          .filter((stored) => stored.playerId === playerId)
          .map(({ skill }) => skill)
          .sort(byEarnedAt),
      ),
    save: async (playerId, skill) => {
      const isEarned = skills.some(
        (stored) => stored.playerId === playerId && stored.skill.lessonId === skill.lessonId,
      )
      if (!isEarned) {
        skills.push({ playerId, skill })
      }
      return ok(undefined)
    },
  }
}
