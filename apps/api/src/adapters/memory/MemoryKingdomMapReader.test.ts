import { kingdomMapReaderContract } from '../kingdomMapReaderContract'
import { MemoryFiefRepository } from './MemoryFiefRepository'
import { MemoryKingdomMapReader } from './MemoryKingdomMapReader'

kingdomMapReaderContract('MemoryKingdomMapReader', async () => {
  const fiefs = new MemoryFiefRepository()
  return { map: new MemoryKingdomMapReader(fiefs), fiefs, registerPlayers: async () => {} }
})
