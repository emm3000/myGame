import { inject } from 'vitest'

const poolId = Number(process.env.VITEST_POOL_ID)
const workerDatabaseUrl = inject('workerDatabaseUrls')[poolId - 1]
if (!workerDatabaseUrl) {
  throw new Error(`no test database for the Vitest worker ${process.env.VITEST_POOL_ID}`)
}
process.env.DATABASE_URL = workerDatabaseUrl
