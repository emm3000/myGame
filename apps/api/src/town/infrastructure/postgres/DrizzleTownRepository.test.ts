import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll, beforeAll } from 'vitest'
import { townRepositoryContract } from '../memory/townRepositoryContract.testSupport'
import { DrizzleEarnedSkills } from './DrizzleEarnedSkillRepository'
import { DrizzleTownRepository } from './DrizzleTownRepository'
import { townTestDatabase } from './townTestDatabase.testSupport'

const { open, close, pool, registerPlayers, truncateAll } = townTestDatabase()

beforeAll(open)

afterAll(close)

townRepositoryContract('DrizzleTownRepository', async () => {
  await truncateAll()
  return {
    towns: new DrizzleTownRepository(drizzle(pool()), 'lockFree'),
    skills: new DrizzleEarnedSkills(drizzle(pool())),
    registerPlayers,
  }
})
