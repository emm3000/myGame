import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll, beforeAll } from 'vitest'
import { DrizzleEarnedSkillRepository } from './DrizzleEarnedSkillRepository'
import { DrizzleTownRepository } from './DrizzleTownRepository'
import { townRepositoryContract } from './townRepositoryContract.testSupport'
import { townTestDatabase } from './townTestDatabase.testSupport'

const { open, close, pool, registerPlayers, truncateAll } = townTestDatabase()

beforeAll(open)

afterAll(close)

townRepositoryContract('DrizzleTownRepository', async () => {
  await truncateAll()
  return {
    towns: new DrizzleTownRepository(drizzle(pool()), 'lockFree'),
    skills: new DrizzleEarnedSkillRepository(drizzle(pool())),
    registerPlayers,
  }
})
