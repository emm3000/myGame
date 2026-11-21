import { MemoryEarnedSkills } from './MemoryEarnedSkills'
import { MemoryTownRepository } from './MemoryTownRepository'
import { townRepositoryContract } from './townRepositoryContract.testSupport'

townRepositoryContract('MemoryTownRepository', async () => {
  const skills = new MemoryEarnedSkills()
  return { towns: new MemoryTownRepository(skills), skills, registerPlayers: async () => {} }
})
