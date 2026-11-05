import type { DomainError } from '../DomainError'
import type { PlayerId } from '../player/PlayerId'
import type { Result } from '../Result'
import type { TownSkill } from './TownSkill'

export interface EarnedSkillRepository {
  skillsOf(playerId: PlayerId): Promise<Result<ReadonlyArray<TownSkill>, DomainError>>
  save(playerId: PlayerId, skill: TownSkill): Promise<Result<void, DomainError>>
}
