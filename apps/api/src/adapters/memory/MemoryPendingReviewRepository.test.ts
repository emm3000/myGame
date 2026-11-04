import { pendingReviewRepositoryContract } from '../pendingReviewRepositoryContract'
import { MemoryPendingReviewRepository } from './MemoryPendingReviewRepository'

pendingReviewRepositoryContract('MemoryPendingReviewRepository', async () => ({
  pendingReviews: new MemoryPendingReviewRepository(),
  registerPlayers: async () => {},
}))
