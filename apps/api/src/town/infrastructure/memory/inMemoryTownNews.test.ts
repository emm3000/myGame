import { MemoryTownNews } from './MemoryTownNews'
import { townNewsContract } from './townNewsContract.testSupport'

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
