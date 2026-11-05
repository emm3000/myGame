import { townNewsContract } from '../townNewsContract'
import { MemoryTownNews } from './MemoryTownNews'

townNewsContract('MemoryTownNews', async () => {
  const news = new MemoryTownNews()
  return {
    news,
    registerTowns: async () => {},
    recordThenRollBack: async (townId, events) => {
      await news.draft().record(townId, events)
    },
  }
})
