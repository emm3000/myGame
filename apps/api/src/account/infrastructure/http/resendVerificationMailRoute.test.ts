import { ApiErrorSchema } from '@mygame/contracts'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import { type ComposedServer, composeServer } from '#composeServer'
import { mailEnvironment } from '#composeServer.testSupport'
import { MemoryMailer } from '../memory/MemoryMailer'
import {
  accountRequests,
  anasSignUp,
  contentDirectory,
  databaseUrl,
  type MovableClock,
  movableClock,
  post,
  sessionCookieOf,
  tokenOf,
  truncateAccounts,
} from './accountRoutes.testSupport'

describe('the verification resend route', () => {
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

  const { signUpAna, verifyEmail } = accountRequests(() => app)

  const resendFor = async (cookie: string, resendingApp = app): Promise<Response> =>
    resendingApp.request('/auth/verify-email/resend', post({}, cookie))

  it('stops the earlier link working when a new one is sent', async () => {
    const cookie = sessionCookieOf(await signUpAna())
    const earlierToken = tokenOf(mailer.sentTo(anasSignUp.email)[0])

    const resent = await resendFor(cookie)

    expect(resent.status).toBe(204)
    const laterToken = tokenOf(mailer.sentTo(anasSignUp.email)[1])
    expect((await verifyEmail(earlierToken)).status).toBe(400)
    expect((await verifyEmail(laterToken)).status).toBe(204)
  })

  it('sends no mail to a verified player', async () => {
    const cookie = sessionCookieOf(await signUpAna())
    await verifyEmail(tokenOf(mailer.sentTo(anasSignUp.email)[0]))

    const resent = await resendFor(cookie)

    expect(resent.status).toBe(204)
    expect(mailer.sentTo(anasSignUp.email)).toHaveLength(1)
  })

  it('answers 503 when the new link cannot be sent', async () => {
    const cookie = sessionCookieOf(await signUpAna())
    const failingApp = createApp({ ...server, clock, mailer: MemoryMailer.failing() })

    const resent = await resendFor(cookie, failingApp)

    expect(resent.status).toBe(503)
    expect(ApiErrorSchema.parse(await resent.json()).kind).toBe('MailNotSent')
  })

  it('answers 401 for a resend without a session', async () => {
    const response = await app.request('/auth/verify-email/resend', post({}))

    expect(response.status).toBe(401)
  })
})
