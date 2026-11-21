import { readMigrationFiles } from 'drizzle-orm/migrator'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { Client } from 'pg'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  ana,
  bruno,
  insertPlayersBeforeTheReport,
} from '#account/infrastructure/postgres/migrationPlayers.testSupport'
import {
  applyMigrations,
  checkViolation,
  closeWithoutChanges,
  migratedFrom,
  migratedThroughNext,
  migrationsFolder,
  openEmptyDatabase,
  uniqueViolation,
} from '#platform/infrastructure/postgres/migrationDatabase.testSupport'
import { DrizzleTownRepository } from './DrizzleTownRepository'
import { insertTownOf, plainStocks } from './migrationTowns.testSupport'
import { earnedSkills } from './schoolTables'

describe('the town migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
    await migratedFrom(client, 31, async () => {
      await insertPlayersBeforeTheReport(client)
    })
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  it('founds no town for a player stored before the migration', async () => {
    const towns = new DrizzleTownRepository(drizzle(client), 'lockFree')

    expect(await towns.holdsTown(ana.id)).toBe(false)
  })

  it('refuses a fractional stock', async () => {
    await expect(
      insertTownOf(client, ana.id, 1, { ...plainStocks, food: 2.5 }),
    ).rejects.toMatchObject({ code: checkViolation, constraint: 'towns_food_whole' })
  })

  it('refuses a negative stock', async () => {
    await expect(
      insertTownOf(client, ana.id, 1, { ...plainStocks, money: -1 }),
    ).rejects.toMatchObject({ code: checkViolation, constraint: 'towns_money_whole' })
  })

  it('refuses a second town for one player', async () => {
    await insertTownOf(client, ana.id, 1, plainStocks)

    await expect(insertTownOf(client, ana.id, 2, plainStocks)).rejects.toMatchObject({
      code: uniqueViolation,
      constraint: 'towns_player_unique',
    })
  })

  it("drops a deleted player's town and its building levels", async () => {
    await insertTownOf(client, ana.id, 1, plainStocks)
    await client.query(
      `INSERT INTO town_buildings (town_id, building, level)
       SELECT id, 'homes', 1 FROM towns WHERE player_id = $1`,
      [ana.id],
    )

    await client.query('DELETE FROM players WHERE id = $1', [ana.id])

    const left = await client.query(
      'SELECT (SELECT count(*) FROM towns) + (SELECT count(*) FROM town_buildings) AS count',
    )
    expect(left.rows).toEqual([{ count: '0' }])
  })

  it('refuses two towns on one site', async () => {
    await insertTownOf(client, ana.id, 1, plainStocks)

    await expect(insertTownOf(client, bruno.id, 1, plainStocks)).rejects.toMatchObject({
      code: uniqueViolation,
      constraint: 'towns_site_unique',
    })
  })
})

describe('the building work and town news migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
    await migratedThroughNext(client, 32, async () => {
      await insertPlayersBeforeTheReport(client)
      await insertTownOf(client, ana.id, 1, plainStocks)
    })
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  const insertEventOf = async (
    kind: string,
    building: string | null,
    level: number | null,
  ): Promise<void> => {
    await client.query(
      `INSERT INTO town_events (town_id, kind, building, level, occurred_at)
       SELECT id, $1, $2, $3, '2026-11-05T08:00:00Z' FROM towns WHERE player_id = $4`,
      [kind, building, level, ana.id],
    )
  }

  it('reads every stored player at the migration instant', async () => {
    const read = await client.query<{ id: string; atMigration: boolean }>(
      'SELECT id, report_read_at = now() AS "atMigration" FROM players ORDER BY id',
    )

    expect(read.rows).toEqual([
      { id: ana.id, atMigration: true },
      { id: bruno.id, atMigration: true },
    ])
  })

  it('stores a town stored before the migration idle with nothing waiting', async () => {
    const read = await client.query(
      `SELECT work_building AS building, (SELECT count(*) FROM town_waiting_work) AS waiting
       FROM towns WHERE player_id = $1`,
      [ana.id],
    )

    expect(read.rows).toEqual([{ building: null, waiting: '0' }])
  })

  it('holds every kind of town event', async () => {
    const kinds = await client.query<{ kind: string }>(
      'SELECT unnest(enum_range(NULL::town_event_kind))::text AS kind',
    )

    expect(kinds.rows.map(({ kind }) => kind)).toEqual([
      'building_work_finished',
      'building_work_stopped',
      'lesson_studied',
      'lesson_stopped',
      'skill_earned',
      'hiring_delivered',
      'hiring_stopped',
      'job_back',
      'job_called_back',
      'clean_up_done',
      'clean_up_failed',
      'became_city',
    ])
  })

  it('refuses building work in the slot without its finish', async () => {
    await expect(
      client.query(
        `UPDATE towns SET work_building = 'farm', work_level = 1, work_started_at = stored_at,
           work_cost_money = 0, work_cost_food = 0, work_cost_power = 0, work_cost_material = 0`,
      ),
    ).rejects.toMatchObject({ code: checkViolation, constraint: 'towns_work_slot_terms' })
  })

  it('refuses two waiting entries at one position of a town', async () => {
    const insertWaiting = (): Promise<unknown> =>
      client.query(
        `INSERT INTO town_waiting_work (town_id, position, building, level, cost_money, cost_food, cost_power, cost_material, duration_seconds)
         SELECT id, 0, 'farm', 1, 0, 0, 0, 0, 60 FROM towns WHERE player_id = $1`,
        [ana.id],
      )
    await insertWaiting()

    await expect(insertWaiting()).rejects.toMatchObject({
      code: uniqueViolation,
      constraint: 'town_waiting_work_pkey',
    })
  })

  it('refuses a building work event without its building', async () => {
    await expect(insertEventOf('building_work_finished', null, null)).rejects.toMatchObject({
      code: checkViolation,
      constraint: 'town_events_building_terms',
    })
  })

  it('refuses a building named on an event of another kind', async () => {
    await expect(insertEventOf('became_city', 'homes', 2)).rejects.toMatchObject({
      code: checkViolation,
      constraint: 'town_events_building_terms',
    })
  })

  it("drops a deleted town's waiting work and events", async () => {
    await client.query(
      `INSERT INTO town_waiting_work (town_id, position, building, level, cost_money, cost_food, cost_power, cost_material, duration_seconds)
       SELECT id, 0, 'farm', 1, 0, 0, 0, 0, 60 FROM towns WHERE player_id = $1`,
      [ana.id],
    )
    await insertEventOf('became_city', null, null)

    await client.query('DELETE FROM players WHERE id = $1', [ana.id])

    const left = await client.query(
      'SELECT (SELECT count(*) FROM town_waiting_work) + (SELECT count(*) FROM town_events) AS count',
    )
    expect(left.rows).toEqual([{ count: '0' }])
  })
})

describe('the skills move migration', () => {
  let client: Client

  beforeEach(async () => {
    client = await openEmptyDatabase()
  })

  afterEach(async () => {
    await closeWithoutChanges(client)
  })

  const insertPlayersOfBuildingWorkVersion = async (): Promise<void> => {
    await client.query(
      `INSERT INTO players (id, email, password_hash, created_at, digest_acknowledged_at, report_read_at)
       VALUES ($1, $2, 'argon2id-hash', '2026-09-22T08:00:00Z', '2026-09-22T08:00:00Z', '2026-09-22T08:00:00Z')`,
      [ana.id, ana.email],
    )
  }

  const insertSkillOfPreviousVersion = async (resource: string): Promise<void> => {
    await client.query(
      `INSERT INTO player_skills (player_id, lesson_id, resource, rate_percent, earned_at)
       VALUES ($1, 'lesson-1', $2, 5, '2026-11-23T09:10:00Z')`,
      [ana.id, resource],
    )
  }

  it('copies a food skill to the town food, keeping its lesson, percent and instant', async () => {
    await migratedFrom(client, 33, async () => {
      await insertPlayersOfBuildingWorkVersion()
      await insertSkillOfPreviousVersion('food')
    })

    const copied = await drizzle(client).select().from(earnedSkills)

    expect(copied).toEqual([
      {
        playerId: ana.id,
        lessonId: 'lesson-1',
        resource: 'food',
        ratePercent: 5,
        earnedAt: new Date('2026-11-23T09:10:00Z'),
      },
    ])
  })

  const failedSkillsMove = async (seed: () => Promise<void>): Promise<unknown> => {
    const migrations = readMigrationFiles({ migrationsFolder })
    await applyMigrations(client, migrations.slice(0, 33))
    await seed()
    await client.query('SAVEPOINT skills_move')
    const failure = await applyMigrations(client, migrations.slice(33)).then(
      () => undefined,
      (refused: unknown) => refused,
    )
    await client.query('ROLLBACK TO SAVEPOINT skills_move')
    return failure
  }

  it('fails on a skill earned on another resource than food', async () => {
    const failure = await failedSkillsMove(async () => {
      await insertPlayersOfBuildingWorkVersion()
      await insertSkillOfPreviousVersion('wood')
    })

    expect(failure).toMatchObject({
      message: 'player_skills holds a skill on a resource other than food',
    })
  })

  it('fails on a town stored before the move', async () => {
    const failure = await failedSkillsMove(async () => {
      await insertPlayersOfBuildingWorkVersion()
      await insertSkillOfPreviousVersion('food')
      await insertTownOf(client, ana.id, 1, plainStocks)
    })

    expect(failure).toMatchObject({ message: 'towns holds a town before the skills move' })
  })
})
