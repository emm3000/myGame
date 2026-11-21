import { earnedSkillRepositoryContract } from './earnedSkillRepositoryContract.testSupport'
import { MemoryEarnedSkills } from './MemoryEarnedSkills'

earnedSkillRepositoryContract('MemoryEarnedSkills', async () => ({
  skills: new MemoryEarnedSkills(),
  registerPlayers: async () => {},
}))
