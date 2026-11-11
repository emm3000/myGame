import { cleanUpRepositoryContract } from '../cleanUpRepositoryContract'
import { MemoryCleanUpRepository } from './MemoryCleanUpRepository'

cleanUpRepositoryContract('MemoryCleanUpRepository', async () => new MemoryCleanUpRepository())
