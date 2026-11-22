import { inMemoryEarnedSkills, inMemoryTowns } from '@mygame/domain/testing'
import { townRepositoryContract } from './townRepositoryContract.testSupport'

townRepositoryContract('inMemoryTowns', async () => {
  const skills = inMemoryEarnedSkills([])
  return { towns: inMemoryTowns([], skills), skills, registerPlayers: async () => {} }
})
