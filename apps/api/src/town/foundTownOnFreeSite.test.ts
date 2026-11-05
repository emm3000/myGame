import { fileURLToPath } from 'node:url'
import { type DomainError, Instant, type PlayerId, type Result } from '@mygame/domain'
import type { Town, TownRepository } from '@mygame/domain/town'
import { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type ComposedServer, composeServer } from '../composeServer'
import { mailEnvironment } from '../composeServer.testSupport'
import { foundTownOnFreeSite } from './foundTownOnFreeSite'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

const foundedAt = Instant.fromEpochMilliseconds(Date.parse('2026-11-05T08:00:00Z'))
const frozenClock = { now: (): Instant => foundedAt }
const ana: PlayerId = '00000000-0000-4000-8000-000000000001'
const bea: PlayerId = '00000000-0000-4000-8000-000000000002'

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

const withSignedUpPlayers = async (playerIds: ReadonlyArray<PlayerId>): Promise<void> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    await client.query(
      'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, player_seen_hints, player_skills, cards, pending_reviews, review_log, sessions, account_tokens, fiefs, fief_buildings, fief_queue_entries, fief_arts, fief_events, fief_units, fief_recruit_orders, fief_marches, fief_incoming_cargo, camp_battles',
    )
    for (const playerId of playerIds) {
      await client.query(
        'INSERT INTO players (id, email, password_hash, created_at, digest_acknowledged_at, report_read_at) VALUES ($1, $2, $3, $4, $4, $4)',
        [playerId, `${playerId}@example.com`, 'argon2id-hash', new Date('2026-11-05T08:00:00Z')],
      )
    }
  } finally {
    await client.end()
  }
}

const townRowCount = async (): Promise<number> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    const counted = await client.query<{ towns: number }>(
      'SELECT count(*)::int AS towns FROM towns',
    )
    return counted.rows[0]?.towns ?? 0
  } finally {
    await client.end()
  }
}

type Outcome = 'founded' | DomainError['kind']

const outcomeOf = (founded: Result<Town, DomainError>): Outcome =>
  founded.ok ? 'founded' : founded.error.kind

const meetingOfTwo = (): (() => Promise<void>) => {
  let arrived = 0
  let release = (): void => {}
  const released = new Promise<void>((settle) => {
    release = settle
  })
  return () => {
    arrived += 1
    if (arrived === 2) {
      release()
    }
    return released
  }
}

const waitingAfterFirstSiteRead = (
  towns: TownRepository,
  meet: () => Promise<void>,
): TownRepository => {
  let hasReadSites = false
  return {
    occupiedSites: async () => {
      const sites = await towns.occupiedSites()
      if (!hasReadSites) {
        hasReadSites = true
        await meet()
      }
      return sites
    },
    holdsTown: (playerId) => towns.holdsTown(playerId),
    townOf: (playerId) => towns.townOf(playerId),
    save: (town) => towns.save(town),
  }
}

const raceTwoFoundings = (
  server: ComposedServer,
  playerIds: readonly [PlayerId, PlayerId],
): Promise<ReadonlyArray<Outcome>> => {
  const meet = meetingOfTwo()
  const found = (playerId: PlayerId): Promise<Outcome> =>
    server
      .inTransaction(({ towns }) =>
        foundTownOnFreeSite(
          { playerId, name: 'Maple Falls' },
          {
            towns: waitingAfterFirstSiteRead(towns, meet),
            catalog: server.townCatalog,
            clock: frozenClock,
            ids: server.ids,
          },
        ),
      )
      .then(outcomeOf)
  return Promise.all(playerIds.map(found))
}

describe('foundTownOnFreeSite', () => {
  let server: ComposedServer

  beforeAll(() => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  it('refuses the second of two racing foundings for one player as a town already held', async () => {
    await withSignedUpPlayers([ana])

    const outcomes = await raceTwoFoundings(server, [ana, ana])

    expect([...outcomes].sort()).toEqual(['PlayerAlreadyHoldsTown', 'founded'])
  })

  it('seats one town when two foundings for one player race for the same site', async () => {
    await withSignedUpPlayers([ana])

    await raceTwoFoundings(server, [ana, ana])

    expect(await townRowCount()).toBe(1)
  })

  it('founds both towns when two players race for the same site', async () => {
    await withSignedUpPlayers([ana, bea])

    const outcomes = await raceTwoFoundings(server, [ana, bea])

    expect(outcomes).toEqual(['founded', 'founded'])
  })
})
