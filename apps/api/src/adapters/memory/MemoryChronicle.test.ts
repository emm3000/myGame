import { chronicleContract } from '../chronicleContract'
import { MemoryChronicle } from './MemoryChronicle'

chronicleContract('MemoryChronicle', async () => ({
  chronicle: new MemoryChronicle(),
  registerFiefs: async () => {},
}))
