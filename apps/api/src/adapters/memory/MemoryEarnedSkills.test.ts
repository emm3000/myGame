import { earnedSkillRepositoryContract } from '../earnedSkillRepositoryContract'
import { MemoryEarnedSkills } from './MemoryEarnedSkills'

earnedSkillRepositoryContract('MemoryEarnedSkills', async () => ({
  skills: new MemoryEarnedSkills(),
  registerPlayers: async () => {},
}))
