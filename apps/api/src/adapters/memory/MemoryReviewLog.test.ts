import { reviewLogContract } from '../reviewLogContract'
import { MemoryReviewLog } from './MemoryReviewLog'

reviewLogContract('MemoryReviewLog', async () => {
  const reviewLog = new MemoryReviewLog()
  return {
    reviewLog,
    registerPlayers: async () => {},
    loggedEntriesOf: async (playerId) => reviewLog.entriesOf(playerId),
  }
})
