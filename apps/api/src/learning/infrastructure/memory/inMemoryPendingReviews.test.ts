import { inMemoryPendingReviews } from '@mygame/domain/testing'
import { pendingReviewRepositoryContract } from './pendingReviewRepositoryContract.testSupport'

pendingReviewRepositoryContract('inMemoryPendingReviews', async () => ({
  pendingReviews: inMemoryPendingReviews(),
  registerPlayers: async () => {},
  registerCards: async () => {},
}))
