import { fileURLToPath } from 'node:url'
import {
  type DomainError,
  type Fief,
  type FiefRepository,
  Instant,
  type PlayerId,
  type Result,
} from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type ComposedServer, composeServer } from '../composeServer'
import { foundFiefOnFreePlot } from './foundFiefOnFreePlot'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

const foundedAt = Instant.fromEpochMilliseconds(Date.parse('2026-09-22T08:00:00Z'))
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
    await client.query('TRUNCATE players, sessions, fiefs, fief_buildings, fief_queue_entries')
    for (const playerId of playerIds) {
      await client.query(
        'INSERT INTO players (id, email, password_hash, created_at) VALUES ($1, $2, $3, $4)',
        [playerId, `${playerId}@example.com`, 'argon2id-hash', new Date('2026-09-22T08:00:00Z')],
      )
    }
  } finally {
    await client.end()
  }
}

const fiefRowCount = async (): Promise<number> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    const counted = await client.query<{ fiefs: number }>(
      'SELECT count(*)::int AS fiefs FROM fiefs',
    )
    return counted.rows[0]?.fiefs ?? 0
  } finally {
    await client.end()
  }
}

type Outcome = 'founded' | DomainError['kind']

const outcomeOf = (founded: Result<Fief, DomainError>): Outcome =>
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

const waitingAfterFirstPlotRead = (
  fiefs: FiefRepository,
  meet: () => Promise<void>,
): FiefRepository => {
  let hasReadPlots = false
  return {
    occupiedPlots: async () => {
      const plots = await fiefs.occupiedPlots()
      if (!hasReadPlots) {
        hasReadPlots = true
        await meet()
      }
      return plots
    },
    holdsFief: (playerId) => fiefs.holdsFief(playerId),
    fiefOf: (playerId) => fiefs.fiefOf(playerId),
    save: (fief) => fiefs.save(fief),
  }
}

const raceTwoFoundings = (
  server: ComposedServer,
  playerIds: readonly [PlayerId, PlayerId],
): Promise<ReadonlyArray<Outcome>> => {
  const meet = meetingOfTwo()
  const found = (playerId: PlayerId): Promise<Outcome> =>
    server
      .inTransaction(({ fiefs }) =>
        foundFiefOnFreePlot(
          { playerId, name: 'Valdehierro' },
          {
            fiefs: waitingAfterFirstPlotRead(fiefs, meet),
            catalog: server.buildingCatalog,
            clock: frozenClock,
            ids: server.ids,
          },
        ),
      )
      .then(outcomeOf)
  return Promise.all(playerIds.map(found))
}

describe('foundFiefOnFreePlot', () => {
  let server: ComposedServer

  beforeAll(() => {
    server = composeServer({ API_PORT: '3192', DATABASE_URL: databaseUrl() }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  it('refuses the second of two racing foundings for one player as a fief already held', async () => {
    await withSignedUpPlayers([ana])

    const outcomes = await raceTwoFoundings(server, [ana, ana])

    expect([...outcomes].sort()).toEqual(['PlayerAlreadyHoldsFief', 'founded'])
  })

  it('seats one fief when two foundings for one player race for the same plot', async () => {
    await withSignedUpPlayers([ana])

    await raceTwoFoundings(server, [ana, ana])

    expect(await fiefRowCount()).toBe(1)
  })

  it('founds both fiefs when two players race for the same plot', async () => {
    await withSignedUpPlayers([ana, bea])

    const outcomes = await raceTwoFoundings(server, [ana, bea])

    expect(outcomes).toEqual(['founded', 'founded'])
  })
})
