import { fiefRepositoryContract } from '../fiefRepositoryContract'
import { MemoryFiefRepository } from './MemoryFiefRepository'

fiefRepositoryContract('MemoryFiefRepository', async () => ({
  fiefs: new MemoryFiefRepository(),
  registerPlayers: async () => {},
}))
