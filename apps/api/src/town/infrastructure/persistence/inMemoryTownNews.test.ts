import { inMemoryTownNews, MemoryTownNewsReader } from '@mygame/domain/testing'
import { townNewsContract } from './townNewsContract.testSupport'

const recordsNothing = async (): Promise<void> => {}

townNewsContract('inMemoryTownNews', async () => {
  const news = inMemoryTownNews()
  return {
    news,
    reader: new MemoryTownNewsReader((townId) => news.recordedEventsOf(townId)),
    registerTowns: async () => {},
    recordThenRollBack: recordsNothing,
  }
})
