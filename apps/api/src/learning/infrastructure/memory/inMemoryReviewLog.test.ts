import { inMemoryReviewLog } from '@mygame/domain/testing'
import { reviewLogContract } from './reviewLogContract.testSupport'

reviewLogContract('inMemoryReviewLog', async () => {
  const reviewLog = inMemoryReviewLog()
  return {
    reviewLog,
    registerPlayers: async () => {},
    logBeforeTheShownFrame: async (entry) => {
      await reviewLog.append({ ...entry, shownFrame: null })
    },
    loggedEntriesOf: async (playerId) =>
      reviewLog.entries().filter((entry) => entry.playerId === playerId),
  }
})
