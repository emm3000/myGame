import { inMemoryCards } from '@mygame/domain/testing'
import { cardRepositoryContract } from './cardRepositoryContract.testSupport'

cardRepositoryContract('inMemoryCards', async () => ({
  cards: inMemoryCards([]),
  registerPlayers: async () => {},
}))
