import { inMemoryPlacements } from '@mygame/domain/testing'
import { placementRepositoryContract } from './placementRepositoryContract.testSupport'

placementRepositoryContract('inMemoryPlacements', async () => ({
  placements: inMemoryPlacements([]),
  registerPlayers: async () => {},
}))
