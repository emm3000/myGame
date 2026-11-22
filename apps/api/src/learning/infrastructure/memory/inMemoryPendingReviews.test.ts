import { MemoryPendingReviewRepository } from './MemoryPendingReviewRepository'
import { pendingReviewRepositoryContract } from './pendingReviewRepositoryContract.testSupport'

pendingReviewRepositoryContract('MemoryPendingReviewRepository', async () => ({
  pendingReviews: new MemoryPendingReviewRepository(),
  registerPlayers: async () => {},
  registerCards: async () => {},
}))
