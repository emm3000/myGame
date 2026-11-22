import { cardRepositoryContract } from './cardRepositoryContract.testSupport'
import { MemoryCardRepository } from './MemoryCardRepository'

cardRepositoryContract('MemoryCardRepository', async () => ({
  cards: new MemoryCardRepository(),
  registerPlayers: async () => {},
}))
