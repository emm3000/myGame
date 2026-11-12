import { placementRepositoryContract } from '../placementRepositoryContract'
import { MemoryPlacements } from './MemoryPlacements'

placementRepositoryContract('MemoryPlacements', async () => ({
  placements: new MemoryPlacements(),
  registerPlayers: async () => {},
}))
