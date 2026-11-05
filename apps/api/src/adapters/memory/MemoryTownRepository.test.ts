import { townRepositoryContract } from '../townRepositoryContract'
import { MemoryTownRepository } from './MemoryTownRepository'

townRepositoryContract('MemoryTownRepository', async () => ({
  towns: new MemoryTownRepository(),
  registerPlayers: async () => {},
}))
