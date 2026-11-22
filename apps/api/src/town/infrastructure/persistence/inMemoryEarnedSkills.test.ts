import { inMemoryEarnedSkills } from '@mygame/domain/testing'
import { earnedSkillRepositoryContract } from './earnedSkillRepositoryContract.testSupport'

earnedSkillRepositoryContract('inMemoryEarnedSkills', async () => ({
  skills: inMemoryEarnedSkills([]),
  registerPlayers: async () => {},
}))
