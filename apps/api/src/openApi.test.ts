import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from './app'
import { type ComposedServer, composeServer } from './composeServer'
import { mailEnvironment } from './composeServer.testSupport'

const contentDirectory = fileURLToPath(new URL('../content/', import.meta.url))

function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return url
}

const committedDocument = (): unknown =>
  JSON.parse(readFileSync(new URL('../openapi.json', import.meta.url), 'utf8'))

const jsonOf = (component: string): object => ({
  content: { 'application/json': { schema: { $ref: `#/components/schemas/${component}` } } },
})

const refusal = jsonOf('ApiError')

const bodiless = { description: expect.any(String) }

const discriminatedBy = (propertyName: string, components: Record<string, string>): object => ({
  discriminator: {
    propertyName,
    mapping: Object.fromEntries(
      Object.entries(components).map(([value, component]) => [
        value,
        `#/components/schemas/${component}`,
      ]),
    ),
  },
})

const isWholeNumberLiteralTypedAsNumber = (node: Record<string, unknown>): boolean =>
  node.type === 'number' &&
  Array.isArray(node.enum) &&
  node.enum.every((literal) => Number.isInteger(literal))

const wholeNumberLiteralsTypedAsNumber = (node: unknown, path = '#'): ReadonlyArray<string> => {
  if (typeof node !== 'object' || node === null) {
    return []
  }
  const here = isWholeNumberLiteralTypedAsNumber(node as Record<string, unknown>) ? [path] : []
  return [
    ...here,
    ...Object.entries(node).flatMap(([key, child]) =>
      wholeNumberLiteralsTypedAsNumber(child, `${path}/${key}`),
    ),
  ]
}

const objectsWithOptionalProperties = (node: unknown, path = '#'): ReadonlyArray<string> => {
  if (typeof node !== 'object' || node === null) {
    return []
  }
  const { properties, required } = node as Record<string, unknown>
  const requiredKeys = Array.isArray(required) ? required : []
  const isMissingARequiredKey =
    typeof properties === 'object' &&
    properties !== null &&
    Object.keys(properties).some((key) => !requiredKeys.includes(key))
  return [
    ...(isMissingARequiredKey ? [path] : []),
    ...Object.entries(node).flatMap(([key, child]) =>
      objectsWithOptionalProperties(child, `${path}/${key}`),
    ),
  ]
}

describe('the OpenAPI document', () => {
  let server: ComposedServer

  beforeAll(() => {
    server = composeServer({ DATABASE_URL: databaseUrl(), ...mailEnvironment }, contentDirectory)
  })

  afterAll(async () => {
    await server.close()
  })

  const servedDocument = async (): Promise<Response> => createApp(server).request('/openapi.json')

  it('serves the OpenAPI document', async () => {
    const response = await servedDocument()

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      openapi: '3.0.0',
      info: { title: 'myGame api' },
    })
  })

  it('declares every account route and the fief overview read', async () => {
    const document = await (await servedDocument()).json()

    expect(document).toMatchObject({
      paths: {
        '/auth/sign-up': {
          post: {
            requestBody: jsonOf('SignUpRequest'),
            responses: { 201: jsonOf('Player'), 400: refusal, 409: refusal },
          },
        },
        '/auth/sign-in': {
          post: {
            requestBody: jsonOf('SignInRequest'),
            responses: { 200: jsonOf('Player'), 401: refusal },
          },
        },
        '/auth/sign-up/native': {
          post: {
            requestBody: jsonOf('SignUpRequest'),
            responses: { 201: jsonOf('NativeSession'), 400: refusal, 409: refusal },
          },
        },
        '/auth/sign-in/native': {
          post: {
            requestBody: jsonOf('SignInRequest'),
            responses: { 200: jsonOf('NativeSession'), 401: refusal },
          },
        },
        '/auth/sign-out': { post: { responses: { 204: bodiless, 401: bodiless } } },
        '/auth/session': { get: { responses: { 200: jsonOf('Player'), 401: bodiless } } },
        '/auth/verify-email': {
          post: {
            requestBody: jsonOf('VerifyEmailRequest'),
            responses: { 204: bodiless, 400: refusal },
          },
        },
        '/auth/verify-email/resend': {
          post: { responses: { 204: bodiless, 401: bodiless, 503: refusal } },
        },
        '/auth/forgot-password': {
          post: {
            requestBody: jsonOf('ForgotPasswordRequest'),
            responses: { 202: bodiless, 400: bodiless },
          },
        },
        '/auth/reset-password': {
          post: {
            requestBody: jsonOf('ResetPasswordRequest'),
            responses: { 204: bodiless, 400: refusal },
          },
        },
        '/fiefs/{fiefId}': {
          get: {
            parameters: [{ in: 'path', name: 'fiefId', required: true }],
            responses: {
              200: jsonOf('FiefOverview'),
              400: bodiless,
              401: bodiless,
              404: refusal,
            },
          },
        },
      },
    })
  })

  it('declares every whole-number literal as an integer', async () => {
    const document = await (await servedDocument()).json()

    expect(wholeNumberLiteralsTypedAsNumber(document)).toEqual([])
  })

  it('requires every key of every object of the committed document, an enum-keyed record included', () => {
    expect(objectsWithOptionalProperties(committedDocument())).toEqual([])
  })

  it('lists every value of a numeric literal union', async () => {
    const document = await (await servedDocument()).json()

    expect(document).toMatchObject({
      components: {
        schemas: {
          ProvinceMap: {
            properties: {
              plots: {
                items: {
                  properties: {
                    camp: { properties: { tier: { type: 'integer', enum: [1, 2, 3] } } },
                  },
                },
              },
            },
          },
        },
      },
    })
  })

  it('names the discriminator of every union in the fief overview', async () => {
    const document = await (await servedDocument()).json()

    expect(document).toMatchObject({
      components: {
        schemas: {
          BuildSlot: discriminatedBy('kind', { idle: 'IdleBuildSlot', busy: 'BusyBuildSlot' }),
          StudySlot: discriminatedBy('kind', { idle: 'IdleStudySlot', busy: 'BusyStudySlot' }),
          MarchState: discriminatedBy('order', {
            forage: 'ForageMarch',
            attack: 'AttackMarch',
            found: 'FoundingMarch',
            transport: 'TransportMarch',
          }),
          Goal: discriminatedBy('state', { pending: 'PendingGoal', underway: 'UnderwayGoal' }),
        },
      },
    })
  })

  it('names the discriminator of the fief event union', async () => {
    const document = await (await servedDocument()).json()

    expect(document).toMatchObject({
      components: {
        schemas: {
          FiefEvent: discriminatedBy('kind', {
            upgradeFinished: 'UpgradeFinishedEvent',
            artLearned: 'ArtLearnedEvent',
            upgradeCancelled: 'UpgradeCancelledEvent',
            studyCancelled: 'StudyCancelledEvent',
            recruitsDelivered: 'RecruitsDeliveredEvent',
            recruitsCancelled: 'RecruitsCancelledEvent',
            marchReturned: 'MarchReturnedEvent',
            battleFought: 'BattleFoughtEvent',
            foundingSent: 'FoundingSentEvent',
            fiefFounded: 'FiefFoundedEvent',
            transportSent: 'TransportSentEvent',
            transportArrived: 'TransportArrivedEvent',
          }),
          FiefChronicle: {
            properties: { events: { items: { $ref: '#/components/schemas/FiefEvent' } } },
          },
        },
      },
    })
  })

  it('keeps a nullable union of the fief overview nullable beside its discriminator', async () => {
    const document = await (await servedDocument()).json()

    expect(document).toMatchObject({
      components: {
        schemas: {
          FiefOverview: {
            properties: {
              march: { allOf: [{ $ref: '#/components/schemas/MarchState' }, { nullable: true }] },
              goal: { allOf: [{ $ref: '#/components/schemas/Goal' }, { nullable: true }] },
            },
          },
        },
      },
    })
  })

  it('matches the committed OpenAPI document', async () => {
    const served = await (await servedDocument()).json()

    expect(served, 'run pnpm --filter @mygame/api openapi:write').toEqual(committedDocument())
  })
})
