import { bandStartRepositoryContract } from './bandStartRepositoryContract.testSupport'
import { MemoryBandStartRepository } from './MemoryBandStartRepository'

bandStartRepositoryContract('MemoryBandStartRepository', async () => ({
  starts: new MemoryBandStartRepository(),
  registerPlayers: async () => {},
}))
