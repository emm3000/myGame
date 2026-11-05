import { townRepositoryContract } from '../townRepositoryContract'
import { MemoryEarnedSkills } from './MemoryEarnedSkills'
import { MemoryTownRepository } from './MemoryTownRepository'

townRepositoryContract('MemoryTownRepository', async () => {
  const skills = new MemoryEarnedSkills()
  return { towns: new MemoryTownRepository(skills), skills, registerPlayers: async () => {} }
})
