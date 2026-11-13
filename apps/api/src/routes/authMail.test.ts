import { fileURLToPath } from 'node:url'
import { Instant } from '@mygame/domain'
import { Client } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { deleteEveryMail, deliveredTo } from '../adapters/smtp/mailpit.testSupport'
import { createApp } from '../app'
import type { Mail, MailDelivery, Mailer } from '../auth/Mailer'
import { type ComposedServer, composeServer } from '../composeServer'
import { mailEnvironment } from '../composeServer.testSupport'

const contentDirectory = fileURLToPath(new URL('../../content/', import.meta.url))

const requiredVariable = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value
}

const fixedClock = {
  now: (): Instant => Instant.fromEpochMilliseconds(Date.parse('2026-11-13T08:00:00Z')),
}

const truncateAccounts = async (): Promise<void> => {
  const client = new Client({ connectionString: requiredVariable('DATABASE_URL') })
  await client.connect()
  try {
    await client.query(
      'TRUNCATE players, towns, town_buildings, town_waiting_work, town_events, town_lesson_slots, town_hires, town_hiring_orders, town_jobs, site_clean_ups, player_seen_tips, earned_skills, band_starts, held_out_words, holdout_checks, holdout_check_words, placements, placement_words, placement_scores, cards, pending_reviews, review_log, sessions, account_tokens',
    )
  } finally {
    await client.end()
  }
}

const post = (body: object, cookie?: string): RequestInit => ({
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    ...(cookie === undefined ? {} : { cookie }),
  },
  body: JSON.stringify(body),
})

const sessionCookieOf = (response: Response): string => {
  const [pair = ''] = (response.headers.get('set-cookie') ?? '').split(';')
  return pair
}

const tokenOf = (mail: Mail | undefined): string => {
  const link = mail?.text.split('\n').find((line) => line.startsWith(mailEnvironment.WEB_URL))
  return link === undefined ? '' : (new URL(link).searchParams.get('token') ?? '')
}

type RecordingMailer = Mailer & {
  readonly deliveries: ReadonlyArray<MailDelivery>
}

const recordingMailer = (mailer: Mailer): RecordingMailer => {
  const deliveries: Array<MailDelivery> = []
  return {
    send: async (mail) => {
      const delivery = await mailer.send(mail)
      deliveries.push(delivery)
      return delivery
    },
    deliveries,
  }
}

const requestContext = Symbol.for('@vercel/request-context')

const hostedBy = (waitUntil: (work: Promise<void>) => void): void => {
  Reflect.set(globalThis, requestContext, { get: () => ({ waitUntil }) })
}

const leaveTheHost = (): void => {
  Reflect.deleteProperty(globalThis, requestContext)
}

const ana = { email: 'ana@example.com', password: 'hierro-y-lana' }

const englishVerificationMail = (token: string): Mail => ({
  to: ana.email,
  subject: 'Confirm your email',
  text: [
    'Open this link to confirm this email for your town:',
    '',
    `http://localhost:3259/verify-email?token=${token}`,
    '',
    'The link works for 24 hours and only once. If it expires, ask for another one from your town.',
    '',
    'If you have not started a town, ignore this email.',
  ].join('\n'),
})

const spanishVerificationMail = (token: string): Mail => ({
  to: ana.email,
  subject: 'Confirma tu correo',
  text: [
    'Confirma que este correo es el de tu pueblo abriendo este enlace:',
    '',
    `http://localhost:3259/verify-email?token=${token}`,
    '',
    'El enlace vale 24 horas y una sola vez. Si caduca, pide otro desde tu pueblo.',
    '',
    'Si no has fundado ningún pueblo, ignora este correo.',
  ].join('\n'),
})

const englishResetMail = (token: string): Mail => ({
  to: ana.email,
  subject: 'Change your password',
  text: [
    'Someone asked to change your Townword password. If it was you, open this link and choose a new one:',
    '',
    `http://localhost:3259/reset-password?token=${token}`,
    '',
    'The link works for one hour and only once.',
    '',
    'If you did not ask for this, ignore this email: your password stays the same.',
  ].join('\n'),
})

const spanishResetMail = (token: string): Mail => ({
  to: ana.email,
  subject: 'Cambia tu contraseña',
  text: [
    'Alguien ha pedido cambiar tu contraseña de Townword. Si fuiste tú, abre este enlace y elige una nueva:',
    '',
    `http://localhost:3259/reset-password?token=${token}`,
    '',
    'El enlace vale una hora y una sola vez.',
    '',
    'Si no pediste nada, ignora este correo: tu contraseña sigue siendo la misma.',
  ].join('\n'),
})

describe('the auth mail in the scaffold language', () => {
  let server: ComposedServer
  let app: ReturnType<typeof createApp>
  let mailer: RecordingMailer

  beforeAll(() => {
    server = composeServer(
      {
        DATABASE_URL: requiredVariable('DATABASE_URL'),
        ...mailEnvironment,
        SMTP_URL: requiredVariable('SMTP_URL'),
      },
      contentDirectory,
    )
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(async () => {
    await truncateAccounts()
    await deleteEveryMail()
    mailer = recordingMailer(server.mailer)
    app = createApp({ ...server, clock: fixedClock, mailer })
  })

  const deliveredMailTo = async (recipient: string): Promise<ReadonlyArray<Mail>> => {
    await server.afterResponse.settled()
    expect(mailer.deliveries).not.toContain('failed')
    return deliveredTo(recipient)
  }

  const signUp = async (scaffold: 'es' | 'none'): Promise<string> =>
    sessionCookieOf(await app.request('/auth/sign-up', post({ ...ana, scaffold })))

  it('sends the verification mail in English to a none player', async () => {
    await signUp('none')

    const delivered = await deliveredMailTo(ana.email)

    expect(delivered).toEqual([englishVerificationMail(tokenOf(delivered[0]))])
  })

  it('sends the verification mail in Spanish to an es player', async () => {
    await signUp('es')

    const delivered = await deliveredMailTo(ana.email)

    expect(delivered).toEqual([spanishVerificationMail(tokenOf(delivered[0]))])
  })

  const changeScaffold = async (cookie: string, scaffold: 'es' | 'none'): Promise<void> => {
    const changed = await app.request('/player/scaffold', {
      method: 'PUT',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ scaffold }),
    })
    expect(changed.status).toBe(200)
  }

  it('resends the verification mail in the scaffold language the player changed to', async () => {
    const cookie = await signUp('es')
    await changeScaffold(cookie, 'none')

    await app.request('/auth/verify-email/resend', post({}, cookie))

    const resent = (await deliveredMailTo(ana.email)).filter(
      (mail) => mail.subject === 'Confirm your email',
    )
    expect(resent).toEqual([englishVerificationMail(tokenOf(resent[0]))])
  })

  const verifiedPlayer = async (scaffold: 'es' | 'none'): Promise<string> => {
    const cookie = await signUp(scaffold)
    const [verificationMail] = await deliveredMailTo(ana.email)
    await app.request('/auth/verify-email', post({ token: tokenOf(verificationMail) }))
    await deleteEveryMail()
    return cookie
  }

  const forgotPassword = async (email: string): Promise<Response> =>
    app.request('/auth/forgot-password', post({ email }))

  it('sends the reset mail in Spanish to an es player', async () => {
    await verifiedPlayer('es')

    await forgotPassword(ana.email)

    const delivered = await deliveredMailTo(ana.email)
    expect(delivered).toEqual([spanishResetMail(tokenOf(delivered[0]))])
  })

  it('sends the reset mail in English to a none player', async () => {
    await verifiedPlayer('none')

    await forgotPassword(ana.email)

    const delivered = await deliveredMailTo(ana.email)
    expect(delivered).toEqual([englishResetMail(tokenOf(delivered[0]))])
  })

  it('sends the reset mail in the scaffold language the player changed to', async () => {
    const cookie = await verifiedPlayer('none')
    await changeScaffold(cookie, 'es')

    await forgotPassword(ana.email)

    const delivered = await deliveredMailTo(ana.email)
    expect(delivered).toEqual([spanishResetMail(tokenOf(delivered[0]))])
  })

  it('answers a reset request for an address with no player as it answers a known one', async () => {
    await verifiedPlayer('none')

    const known = await forgotPassword(ana.email)
    const unknown = await forgotPassword('nadie@example.com')

    expect([unknown.status, await unknown.text()]).toEqual([known.status, await known.text()])
  })

  it('mails nothing in any language to an address with no player', async () => {
    await verifiedPlayer('none')

    await forgotPassword('nadie@example.com')

    expect(await deliveredMailTo('nadie@example.com')).toEqual([])
  })

  it('hands the reset mail to the host to finish after the answer', async () => {
    await verifiedPlayer('none')
    const extended: Array<Promise<void>> = []
    hostedBy((work) => extended.push(work))

    try {
      await forgotPassword(ana.email)
    } finally {
      leaveTheHost()
    }
    await Promise.all(extended)

    const delivered = await deliveredTo(ana.email)
    expect([extended.length, delivered]).toEqual([1, [englishResetMail(tokenOf(delivered[0]))]])
  })
})
