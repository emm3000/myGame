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

  it('declares every account route', async () => {
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

  it('names the discriminator of every union in the town overview and the reviews', async () => {
    const document = await (await servedDocument()).json()

    expect(document).toMatchObject({
      components: {
        schemas: {
          NextStep: discriminatedBy('kind', {
            reviews: 'ReviewsStep',
            lessonRunning: 'LessonRunningStep',
            lessonToStudy: 'LessonToStudyStep',
            caughtUp: 'CaughtUpStep',
          }),
          DueReview: discriminatedBy('mode', {
            recognition: 'RecognitionReview',
            recall: 'RecallReview',
          }),
          ReviewVerdict: discriminatedBy('kind', {
            nearMiss: 'NearMissVerdict',
            correct: 'CorrectVerdict',
            wrong: 'WrongVerdict',
          }),
        },
      },
    })
  })

  it('names the discriminator of the town news union', async () => {
    const document = await (await servedDocument()).json()

    expect(document).toMatchObject({
      components: {
        schemas: {
          TownNewsItem: discriminatedBy('kind', {
            buildingWorkFinished: 'BuildingWorkFinishedNews',
            buildingWorkStopped: 'BuildingWorkStoppedNews',
            lessonStudied: 'LessonStudiedNews',
            lessonStopped: 'LessonStoppedNews',
            skillEarned: 'SkillEarnedNews',
            hiringDelivered: 'HiringDeliveredNews',
            hiringStopped: 'HiringStoppedNews',
            jobBack: 'JobBackNews',
            jobCalledBack: 'JobCalledBackNews',
            cleanUpDone: 'CleanUpDoneNews',
            cleanUpFailed: 'CleanUpFailedNews',
            becameCity: 'BecameCityNews',
          }),
          TownNewsFeed: {
            properties: { items: { items: { $ref: '#/components/schemas/TownNewsItem' } } },
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
