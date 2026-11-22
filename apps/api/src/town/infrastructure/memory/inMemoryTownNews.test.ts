import { inMemoryTownNews } from '@mygame/domain/testing'
import { MemoryTownNewsReader } from './MemoryTownNewsReader'
import { townNewsContract } from './townNewsContract.testSupport'

townNewsContract('inMemoryTownNews', async () => {
  const news = inMemoryTownNews()
  return {
    news,
    reader: new MemoryTownNewsReader((townId) => news.recordedEventsOf(townId)),
    registerTowns: async () => {},
    recordThenRollBack: async () => {},
  }
})
