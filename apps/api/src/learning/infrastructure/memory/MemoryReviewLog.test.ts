import { MemoryReviewLog } from './MemoryReviewLog'
import { reviewLogContract } from './reviewLogContract.testSupport'

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
