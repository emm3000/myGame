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

  it('matches the committed OpenAPI document', async () => {
    const served = await (await servedDocument()).json()

    expect(served, 'run pnpm --filter @mygame/api openapi:write').toEqual(committedDocument())
  })
})
