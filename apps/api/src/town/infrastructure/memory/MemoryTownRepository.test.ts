import { MemoryEarnedSkillRepository } from './MemoryEarnedSkillRepository'
import { MemoryTownRepository } from './MemoryTownRepository'
import { townRepositoryContract } from './townRepositoryContract.testSupport'

townRepositoryContract('MemoryTownRepository', async () => {
  const skills = new MemoryEarnedSkillRepository()
  return { towns: new MemoryTownRepository(skills), skills, registerPlayers: async () => {} }
})
