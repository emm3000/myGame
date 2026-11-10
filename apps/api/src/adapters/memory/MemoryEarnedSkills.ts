import {
  type DomainError,
  type EarnedSkillRepository,
  ok,
  type PlayerId,
  type Result,
  type TownSkill,
} from '@mygame/domain'
import { byEarnedAt } from '../byEarnedAt'

export class MemoryEarnedSkills implements EarnedSkillRepository {
  private readonly skills = new Map<PlayerId, ReadonlyArray<TownSkill>>()

  async skillsOf(playerId: PlayerId): Promise<Result<ReadonlyArray<TownSkill>, DomainError>> {
    return ok([...(this.skills.get(playerId) ?? [])].sort(byEarnedAt))
  }

  async save(playerId: PlayerId, skill: TownSkill): Promise<Result<void, DomainError>> {
    const earned = this.skills.get(playerId) ?? []
    if (!earned.some(({ lessonId }) => lessonId === skill.lessonId)) {
      this.skills.set(playerId, [...earned, skill])
    }
    return ok(undefined)
  }
}
