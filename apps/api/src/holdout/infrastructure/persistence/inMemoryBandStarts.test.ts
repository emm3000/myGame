import { inMemoryBandStarts } from '@mygame/domain/testing'
import { bandStartRepositoryContract } from './bandStartRepositoryContract.testSupport'

bandStartRepositoryContract('inMemoryBandStarts', async () => ({
  starts: inMemoryBandStarts([]),
  registerPlayers: async () => {},
}))
