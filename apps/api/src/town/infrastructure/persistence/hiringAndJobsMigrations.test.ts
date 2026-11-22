import type { Client } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  checkViolation,
  closeWithoutChanges,
  migratedThroughNext,
  openEmptyDatabase,
} from '#platform/infrastructure/persistence/migrationDatabase.testSupport'

const hiringOwnerId = '00000000-0000-4000-8000-0000000000a2'

const hiringTownId = '00000000-0000-4000-8000-0000000000b2'

const migrationsBeforeTheHiring = 36

describe('the town hiring migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
    await migratedThroughNext(client, migrationsBeforeTheHiring, async () => {
      await client.query(
        `INSERT INTO players (id, email, password_hash, created_at, report_read_at)
         VALUES ($1, 'owner@example.com', 'argon2id-hash', '2026-09-22T08:00:00Z', '2026-11-09T08:00:00Z')`,
        [hiringOwnerId],
      )
      await client.query(
        `INSERT INTO towns (id, player_id, region, area, site, name, money, food, power, material, stored_at)
         VALUES ($2, $1, 1, 1, 1, 'Maple Falls', 100, 50, 20, 10, '2026-11-09T08:00:00Z')`,
        [hiringOwnerId, hiringTownId],
      )
      await client.query(
        `INSERT INTO town_buildings (town_id, building, level) VALUES ($1, 'homes', 1), ($1, 'office', 1)`,
        [hiringTownId],
      )
    })
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('gives a town stored before the migration no worker and no truck', async () => {
    const stored = await client.query<{ hire: string; count: number }>(
      'SELECT hire, count FROM town_hires WHERE town_id = $1 ORDER BY hire',
      [hiringTownId],
    )

    expect(stored.rows).toEqual([
      { hire: 'worker', count: 0 },
      { hire: 'truck', count: 0 },
    ])
  })

  it('leaves the hiring slot of a town stored before the migration idle', async () => {
    const stored = await client.query('SELECT 1 FROM town_hiring_orders')

    expect(stored.rowCount).toBe(0)
  })

  it('refuses a hiring order of no hire', async () => {
    const insert = client.query(
      `INSERT INTO town_hiring_orders (town_id, hire, count, cost_money, cost_food, cost_power, cost_material, seconds_per_hire, started_at)
       VALUES ($1, 'worker', 0, 50, 0, 0, 0, 300, '2026-11-09T08:00:00Z')`,
      [hiringTownId],
    )

    await expect(insert).rejects.toMatchObject({
      code: checkViolation,
      constraint: 'town_hiring_orders_count_positive',
    })
  })
})

const jobsOwnerId = '00000000-0000-4000-8000-0000000000a3'

const jobsTownId = '00000000-0000-4000-8000-0000000000b3'

const migrationsBeforeTheJobs = 37

const insertJobOf = (
  client: Client,
  [workerCount, truckCount]: readonly [number, number],
): Promise<unknown> =>
  client.query(
    `INSERT INTO town_jobs (town_id, region, area, site, worker_count, truck_count, hours, sent_at, one_way_seconds, pay_money, pay_food, pay_power, pay_material, pay_percent_money, pay_percent_food, pay_percent_power, pay_percent_material)
     VALUES ($1, 1, 2, 4, $2, $3, 2, '2026-11-10T08:00:00Z', 660, 0, 300, 0, 300, 100, 100, 100, 100)`,
    [jobsTownId, workerCount, truckCount],
  )

describe('the town jobs migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
    await migratedThroughNext(client, migrationsBeforeTheJobs, async () => {
      await client.query(
        `INSERT INTO players (id, email, password_hash, created_at, report_read_at)
         VALUES ($1, 'owner@example.com', 'argon2id-hash', '2026-09-22T08:00:00Z', '2026-11-09T08:00:00Z')`,
        [jobsOwnerId],
      )
      await client.query(
        `INSERT INTO towns (id, player_id, region, area, site, name, money, food, power, material, stored_at)
         VALUES ($2, $1, 1, 1, 1, 'Maple Falls', 100, 50, 20, 10, '2026-11-09T08:00:00Z')`,
        [jobsOwnerId, jobsTownId],
      )
      await client.query(
        `INSERT INTO town_hires (town_id, hire, count) VALUES ($1, 'worker', 3), ($1, 'truck', 1)`,
        [jobsTownId],
      )
    })
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps a town stored before the migration with its job slot idle', async () => {
    const town = await client.query('SELECT name FROM towns WHERE id = $1', [jobsTownId])
    const jobs = await client.query('SELECT 1 FROM town_jobs')

    expect([town.rows, jobs.rowCount]).toEqual([[{ name: 'Maple Falls' }], 0])
  })

  it("stores the job of a town's team", async () => {
    await insertJobOf(client, [2, 1])

    const stored = await client.query<{ worker_count: number; truck_count: number }>(
      'SELECT worker_count, truck_count FROM town_jobs WHERE town_id = $1',
      [jobsTownId],
    )

    expect(stored.rows).toEqual([{ worker_count: 2, truck_count: 1 }])
  })

  it('refuses a job of an empty team', async () => {
    await expect(insertJobOf(client, [0, 0])).rejects.toMatchObject({
      code: checkViolation,
      constraint: 'town_jobs_team_not_empty',
    })
  })
})

const cleanUpsOwnerId = '00000000-0000-4000-8000-0000000000a4'

const cleanUpsTownId = '00000000-0000-4000-8000-0000000000b4'

const migrationsBeforeTheCleanUps = 38

const insertCleanUpOf = (
  client: Client,
  [hours, wasteSize]: readonly [number, number | null],
): Promise<unknown> =>
  client.query(
    `INSERT INTO town_jobs (town_id, region, area, site, worker_count, truck_count, hours, sent_at, one_way_seconds, pay_money, pay_food, pay_power, pay_material, pay_percent_money, pay_percent_food, pay_percent_power, pay_percent_material, waste_size, waste, strength)
     VALUES ($1, 1, 2, 4, 6, 0, $2, '2026-11-11T08:00:00Z', 600, 12, 0, 0, 18, 100, 100, 100, 100, $3, 6, 6)`,
    [cleanUpsTownId, hours, wasteSize],
  )

describe('the site clean-ups migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
    await migratedThroughNext(client, migrationsBeforeTheCleanUps, async () => {
      await client.query(
        `INSERT INTO players (id, email, password_hash, created_at, report_read_at)
         VALUES ($1, 'owner@example.com', 'argon2id-hash', '2026-09-22T08:00:00Z', '2026-11-09T08:00:00Z')`,
        [cleanUpsOwnerId],
      )
      await client.query(
        `INSERT INTO towns (id, player_id, region, area, site, name, money, food, power, material, stored_at)
         VALUES ($2, $1, 1, 1, 1, 'Maple Falls', 100, 50, 20, 10, '2026-11-09T08:00:00Z')`,
        [cleanUpsOwnerId, cleanUpsTownId],
      )
      await client.query(
        `INSERT INTO town_jobs (town_id, region, area, site, worker_count, truck_count, hours, sent_at, one_way_seconds, pay_money, pay_food, pay_power, pay_material, pay_percent_money, pay_percent_food, pay_percent_power, pay_percent_material)
         VALUES ($1, 1, 2, 4, 2, 1, 2, '2026-11-10T08:00:00Z', 660, 0, 300, 0, 300, 100, 100, 100, 100)`,
        [cleanUpsTownId],
      )
    })
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('keeps a job stored before the migration as a job, with no clean-up', async () => {
    const stored = await client.query(
      'SELECT hours, waste_size, waste, strength, has_arrived FROM town_jobs WHERE town_id = $1',
      [cleanUpsTownId],
    )

    expect(stored.rows).toEqual([
      { hours: 2, waste_size: null, waste: null, strength: null, has_arrived: false },
    ])
  })

  it('stores a clean-up that stays no hour at the site', async () => {
    await client.query('DELETE FROM town_jobs')
    await insertCleanUpOf(client, [0, 1])

    const stored = await client.query('SELECT hours, waste_size FROM town_jobs')

    expect(stored.rows).toEqual([{ hours: 0, waste_size: 1 }])
  })

  it('refuses a job of no hours that cleans no waste', async () => {
    await client.query('DELETE FROM town_jobs')

    await expect(insertCleanUpOf(client, [0, null])).rejects.toMatchObject({
      code: checkViolation,
      constraint: 'town_jobs_clean_up_terms',
    })
  })

  it('refuses a clean-up of an unknown size', async () => {
    await client.query('DELETE FROM town_jobs')

    await expect(insertCleanUpOf(client, [0, 4])).rejects.toMatchObject({
      code: checkViolation,
      constraint: 'town_jobs_clean_up_terms',
    })
  })

  it("stores a site's clean-up by the team that cleaned it", async () => {
    await client.query(
      `INSERT INTO site_clean_ups (town_id, sent_at, region, area, site, cleaned_at)
       VALUES ($1, '2026-11-11T08:00:00Z', 1, 2, 4, '2026-11-11T08:10:00Z')`,
      [cleanUpsTownId],
    )

    const stored = await client.query<{ cleaned_at: Date }>(
      'SELECT cleaned_at FROM site_clean_ups WHERE region = 1 AND area = 2 AND site = 4',
    )

    expect(stored.rows.map((row) => row.cleaned_at.toISOString())).toEqual([
      '2026-11-11T08:10:00.000Z',
    ])
  })

  it('refuses a clean-up before its team was sent', async () => {
    await expect(
      client.query(
        `INSERT INTO site_clean_ups (town_id, sent_at, region, area, site, cleaned_at)
         VALUES ($1, '2026-11-11T08:00:00Z', 1, 2, 4, '2026-11-11T07:59:00Z')`,
        [cleanUpsTownId],
      ),
    ).rejects.toMatchObject({
      code: checkViolation,
      constraint: 'site_clean_ups_cleaned_after_sent',
    })
  })
})
