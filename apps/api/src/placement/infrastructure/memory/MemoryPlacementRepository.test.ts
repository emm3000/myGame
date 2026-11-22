import { MemoryPlacementRepository } from './MemoryPlacementRepository'
import { placementRepositoryContract } from './placementRepositoryContract.testSupport'

placementRepositoryContract('MemoryPlacementRepository', async () => ({
  placements: new MemoryPlacementRepository(),
  registerPlayers: async () => {},
}))
