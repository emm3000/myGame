import { bandStartRepositoryContract } from '../bandStartRepositoryContract'
import { MemoryBandStarts } from './MemoryBandStarts'

bandStartRepositoryContract('MemoryBandStarts', async () => ({
  starts: new MemoryBandStarts(),
  registerPlayers: async () => {},
}))
