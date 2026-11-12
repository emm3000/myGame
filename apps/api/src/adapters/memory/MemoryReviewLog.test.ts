import { reviewLogContract } from '../reviewLogContract'
import { MemoryReviewLog } from './MemoryReviewLog'

reviewLogContract('MemoryReviewLog', async () => {
  const reviewLog = new MemoryReviewLog()
  return {
    reviewLog,
    registerPlayers: async () => {},
    logBeforeTheShownFrame: async (entry) => {
      await reviewLog.append({ ...entry, shownFrame: null })
    },
    loggedEntriesOf: async (playerId) => reviewLog.entriesOf(playerId),
  }
})
