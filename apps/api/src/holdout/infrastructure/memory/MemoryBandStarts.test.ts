import { bandStartRepositoryContract } from './bandStartRepositoryContract.testSupport'
import { MemoryBandStarts } from './MemoryBandStarts'

bandStartRepositoryContract('MemoryBandStarts', async () => ({
  starts: new MemoryBandStarts(),
  registerPlayers: async () => {},
}))
