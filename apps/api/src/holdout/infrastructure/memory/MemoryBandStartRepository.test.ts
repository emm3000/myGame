import { bandStartRepositoryContract } from './bandStartRepositoryContract.testSupport'
import { MemoryBandStarts } from './MemoryBandStartRepository'

bandStartRepositoryContract('MemoryBandStarts', async () => ({
  starts: new MemoryBandStarts(),
  registerPlayers: async () => {},
}))
