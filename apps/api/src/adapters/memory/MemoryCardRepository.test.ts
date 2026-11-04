import { cardRepositoryContract } from '../cardRepositoryContract'
import { MemoryCardRepository } from './MemoryCardRepository'

cardRepositoryContract('MemoryCardRepository', async () => ({
  cards: new MemoryCardRepository(),
  registerPlayers: async () => {},
}))
