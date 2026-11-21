import { cleanUpRepositoryContract } from './cleanUpRepositoryContract.testSupport'
import { MemoryCleanUpRepository } from './MemoryCleanUpRepository'

cleanUpRepositoryContract('MemoryCleanUpRepository', async () => new MemoryCleanUpRepository())
