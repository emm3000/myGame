import {
  type ApiErrorKind,
  ApiErrorSchema,
  type Player,
  PlayerSchema,
  type SignInRequest,
  type SignUpRequest,
} from '@mygame/contracts'

export type ApiRefusal = ApiErrorKind | 'Unexpected'

export type ApiOutcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly refusal: ApiRefusal }

export interface ApiClient {
  signUp(request: SignUpRequest): Promise<ApiOutcome<Player>>
  signIn(request: SignInRequest): Promise<ApiOutcome<Player>>
  signOut(): Promise<ApiOutcome<undefined>>
  currentPlayer(): Promise<Player | undefined>
}

const unexpected: ApiOutcome<never> = { ok: false, refusal: 'Unexpected' }

const refusalOf = async (response: Response): Promise<ApiOutcome<never>> => {
  const parsed = ApiErrorSchema.safeParse(await response.json().catch(() => undefined))
  return parsed.success ? { ok: false, refusal: parsed.data.kind } : unexpected
}

const playerOf = async (response: Response): Promise<ApiOutcome<Player>> => {
  if (!response.ok) {
    return refusalOf(response)
  }
  const parsed = PlayerSchema.safeParse(await response.json().catch(() => undefined))
  return parsed.success ? { ok: true, value: parsed.data } : unexpected
}

export const createApiClient = (baseUrl: string): ApiClient => {
  const send = (path: string, init: RequestInit): Promise<Response | undefined> =>
    fetch(`${baseUrl}${path}`, { credentials: 'same-origin', ...init }).catch(() => undefined)

  const postJson = (path: string, body: unknown): Promise<Response | undefined> =>
    send(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })

  return {
    signUp: async (request) => {
      const response = await postJson('/auth/sign-up', request)
      return response === undefined ? unexpected : playerOf(response)
    },
    signIn: async (request) => {
      const response = await postJson('/auth/sign-in', request)
      return response === undefined ? unexpected : playerOf(response)
    },
    signOut: async () => {
      const response = await send('/auth/sign-out', { method: 'POST' })
      if (response === undefined) {
        return unexpected
      }
      return response.ok || response.status === 401 ? { ok: true, value: undefined } : unexpected
    },
    currentPlayer: async () => {
      const response = await send('/auth/session', { method: 'GET' })
      if (response === undefined) {
        return undefined
      }
      const outcome = await playerOf(response)
      return outcome.ok ? outcome.value : undefined
    },
  }
}
