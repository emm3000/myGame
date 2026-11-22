import { MemoryPlacements } from './MemoryPlacementRepository'
import { placementRepositoryContract } from './placementRepositoryContract.testSupport'

placementRepositoryContract('MemoryPlacements', async () => ({
  placements: new MemoryPlacements(),
  registerPlayers: async () => {},
}))
