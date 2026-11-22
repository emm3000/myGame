import { inMemoryCleanUps } from '@mygame/domain/testing'
import { cleanUpRepositoryContract } from './cleanUpRepositoryContract.testSupport'

cleanUpRepositoryContract('inMemoryCleanUps', async () => inMemoryCleanUps())
