import { Instant, type PlayerId, Town, TownAddress, TownName } from '@mygame/domain'
import { drizzle } from 'drizzle-orm/node-postgres'
import { afterAll, assert, beforeAll, describe, expect, it } from 'vitest'
import { isWaitingOnALock, lockProbeLimit } from '#lockWaitProbe.testSupport'
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

const ana: PlayerId = '00000000-0000-4000-8000-000000000001'
const anasTownId = '00000000-0000-4000-8000-00000000000a'

const anasTown = (): Town => {
  const address = TownAddress.create(1, 1, 1)
  const name = TownName.create('Town a')
  assert(address.ok && name.ok)
  return Town.found({
    id: anasTownId,
    playerId: ana,
    name: name.value,
    address: address.value,
    startingStocks: { money: 400, food: 300, power: 200, material: 500 },
    skills: [],
    at: Instant.fromEpochMilliseconds(Date.parse('2026-11-04T08:00:00Z')),
  })
}

const signal = (): { readonly promise: Promise<void>; readonly resolve: () => void } => {
  let resolve = (): void => {}
  const promise = new Promise<void>((settle) => {
    resolve = settle
  })
  return { promise, resolve }
}

const townReadQuery = 'select "id", "player_id", "region", "area", "site", "name", "money"%'

type SecondRead = 'waitedOnTheTownLock' | 'finishedWhileTheFirstHeldTheTown'

const secondReadWhileTheFirstHoldsTheTown = async (work: Promise<void>): Promise<SecondRead> => {
  let isDone = false
  const markDone = (): void => {
    isDone = true
  }
  void work.then(markDone, markDone)
  for (let probes = 0; probes < lockProbeLimit; probes += 1) {
    if (isDone) {
      return 'finishedWhileTheFirstHeldTheTown'
    }
    if (await isWaitingOnALock(pool(), [townReadQuery])) {
      return 'waitedOnTheTownLock'
    }
  }
  throw new Error('The second read neither waited on the town lock nor finished')
}

describe('DrizzleTownRepository read lockedForUpdate', () => {
  it('makes a second locked read of one town in another transaction wait until the first commits', async () => {
    await truncateAll()
    await registerPlayers([ana])
    const database = drizzle(pool())
    assert((await new DrizzleTownRepository(database, 'lockFree').save(anasTown())).ok)
    const firstHoldsTheTown = signal()
    const firstMayCommit = signal()
    const firstRead = database.transaction(async (transaction) => {
      await new DrizzleTownRepository(transaction, 'lockedForUpdate').townOf(ana)
      firstHoldsTheTown.resolve()
      await firstMayCommit.promise
    })
    await Promise.race([firstHoldsTheTown.promise, firstRead])
    let secondTown: Town | undefined
    const secondRead = database.transaction(async (transaction) => {
      const read = await new DrizzleTownRepository(transaction, 'lockedForUpdate').townOf(ana)
      assert(read.ok)
      secondTown = read.value
    })
    let outcome: SecondRead
    try {
      outcome = await secondReadWhileTheFirstHoldsTheTown(secondRead)
    } finally {
      firstMayCommit.resolve()
    }
    await Promise.all([firstRead, secondRead])
    expect(outcome).toBe('waitedOnTheTownLock')
    expect(secondTown?.id).toBe(anasTownId)
  })
})
