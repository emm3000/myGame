import { PlayerSchema } from '@mygame/contracts'
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  anasSignUp,
  contentDirectory,
  databaseUrl,
  type MovableClock,
  movableClock,
  playersWithEmail,
  post,
  truncateAccounts,
} from '#account/infrastructure/http/accountRoutes.testSupport'
import { MemoryMailer } from '#account/infrastructure/memory/MemoryMailer'
import { createApp } from '#app'
import { type ComposedServer, composeServer } from '#composeServer'
import { mailEnvironment } from '#composeServer.testSupport'

const storedTowns = async (): Promise<number> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    const found = await client.query<{ count: number }>('SELECT count(*)::int AS count FROM towns')
    return found.rows[0]?.count ?? -1
  } finally {
    await client.end()
  }
}

describe('the sign-up of a town-less player', () => {
  let server: ComposedServer
  let clock: MovableClock
  let mailer: MemoryMailer
  let app: ReturnType<typeof createApp>

  beforeAll(() => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await truncateAccounts()
    clock = movableClock()
    mailer = new MemoryMailer()
    app = createApp({ ...server, clock, mailer })
  })

  const signUpAna = async (): Promise<Response> => app.request('/auth/sign-up', post(anasSignUp))

  it('signs up without founding anything', async () => {
    const response = await signUpAna()

    expect(response.status).toBe(201)
    PlayerSchema.parse(await response.json())
    expect(await storedTowns()).toBe(0)
  })

  it.each(['/auth/sign-up', '/auth/sign-up/native'])(
    'signs up on %s an older client that sends a field the request no longer names',
    async (route) => {
      const response = await app.request(
        route,
        post({ ...anasSignUp, retiredField: 'Maple Grove' }),
      )

      expect(response.status).toBe(201)
      expect(await playersWithEmail(anasSignUp.email)).toBe(1)
      expect(await storedTowns()).toBe(0)
    },
  )
})
