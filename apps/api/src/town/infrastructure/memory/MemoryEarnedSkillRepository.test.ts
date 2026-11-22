import { earnedSkillRepositoryContract } from './earnedSkillRepositoryContract.testSupport'
import { MemoryEarnedSkills } from './MemoryEarnedSkillRepository'

earnedSkillRepositoryContract('MemoryEarnedSkills', async () => ({
  skills: new MemoryEarnedSkills(),
  registerPlayers: async () => {},
}))
