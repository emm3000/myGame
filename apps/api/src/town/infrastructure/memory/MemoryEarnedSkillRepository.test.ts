import { earnedSkillRepositoryContract } from './earnedSkillRepositoryContract.testSupport'
import { MemoryEarnedSkillRepository } from './MemoryEarnedSkillRepository'

earnedSkillRepositoryContract('MemoryEarnedSkillRepository', async () => ({
  skills: new MemoryEarnedSkillRepository(),
  registerPlayers: async () => {},
}))
