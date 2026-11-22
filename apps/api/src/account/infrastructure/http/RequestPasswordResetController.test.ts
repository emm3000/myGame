import type { UnitOfWork } from '@mygame/domain'
import { MemoryMailer } from '@mygame/domain/testing'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import { type ComposedServer, composeServer } from '#composeServer'
import { mailEnvironment } from '#composeServer.testSupport'
import type { ComposedStores } from '#composeStores'
import {
  accountRequests,
  anasSignUp,
  contentDirectory,
  databaseUrl,
  type MovableClock,
  movableClock,
  passwordResets,
  storedResetTokens,
  tokenOf,
  truncateAccounts,
} from './accountRoutes.testSupport'

describe('the forgot-password route', () => {
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

  const { signUpAna } = accountRequests(() => app)

  const { resetMailsTo, verifiedAna, forgotPassword } = passwordResets(
    () => app,
    () => server,
    () => mailer,
  )

  it('sends a reset link to a verified email', async () => {
    await verifiedAna()

    const response = await forgotPassword(anasSignUp.email)
    await server.afterResponse.settled()

    expect(response.status).toBe(202)
    expect(await response.text()).toBe('')
    const sent = resetMailsTo(anasSignUp.email)
    expect(sent).toHaveLength(1)
    expect(tokenOf(sent[0])).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it('sends nothing to an unverified email', async () => {
    await signUpAna()

    const response = await forgotPassword(anasSignUp.email)
    await server.afterResponse.settled()

    expect(response.status).toBe(202)
    expect(resetMailsTo(anasSignUp.email)).toEqual([])
    expect(await storedResetTokens()).toBe(0)
  })

  it('answers an unknown email as it answers a known one', async () => {
    await verifiedAna()

    const known = await forgotPassword(anasSignUp.email)
    const unknown = await forgotPassword('nadie@example.com')
    await server.afterResponse.settled()

    expect([unknown.status, await unknown.text()]).toEqual([known.status, await known.text()])
    expect(mailer.sentTo('nadie@example.com')).toEqual([])
  })

  it('answers a reset request before it looks the address up', async () => {
    let lookups = 0
    let release = (): void => {}
    const released = new Promise<void>((resolve) => {
      release = resolve
    })
    const heldUnitOfWork: UnitOfWork<ComposedStores> = {
      transact: (work) => {
        lookups += 1
        return released.then(() => server.unitOfWork.transact(work))
      },
    }

    const response = await forgotPassword(
      anasSignUp.email,
      createApp({ ...server, clock, mailer, unitOfWork: heldUnitOfWork }),
    )

    expect([response.status, lookups]).toEqual([202, 1])
    release()
    await server.afterResponse.settled()
  })

  it('reports a reset request whose send threw by the error class alone', async () => {
    await verifiedAna()
    const failures: Array<string> = []
    const throwingApp = createApp({
      ...server,
      clock,
      mailer: { send: () => Promise.reject(new TypeError('ana@example.com refused')) },
      failureSink: { write: (line) => failures.push(line) },
    })

    await forgotPassword(anasSignUp.email, throwingApp)
    await server.afterResponse.settled()

    expect(failures).toEqual(['reset request TypeError'])
  })

  it('answers 202 when the reset link cannot be sent', async () => {
    await verifiedAna()
    const failingApp = createApp({ ...server, clock, mailer: MemoryMailer.failing() })

    const response = await forgotPassword(anasSignUp.email, failingApp)
    await server.afterResponse.settled()

    expect(response.status).toBe(202)
  })

  it('reports a reset request whose mail could not be sent without its address', async () => {
    await verifiedAna()
    const failures: Array<string> = []
    const failingApp = createApp({
      ...server,
      clock,
      mailer: MemoryMailer.failing(),
      failureSink: { write: (line) => failures.push(line) },
    })

    await forgotPassword(anasSignUp.email, failingApp)
    await server.afterResponse.settled()

    expect(failures).toEqual(['reset request MailNotSent'])
  })

  it('refuses a reset request with a malformed email', async () => {
    const response = await forgotPassword('ana')

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('')
  })
})
