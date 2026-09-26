import {
  type ApiErrorKind,
  ApiErrorSchema,
  type BuildingKind,
  type EnqueueBuildingRequest,
  type FiefOverview,
  FiefOverviewSchema,
  type Player,
  PlayerSchema,
  type SignInRequest,
  type SignUpRequest,
} from '@mygame/contracts'
import type { ZodType } from 'zod'

export type ApiRefusal = ApiErrorKind | 'Unexpected'

export type ApiOutcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly refusal: ApiRefusal }

export interface ApiClient {
  signUp(request: SignUpRequest): Promise<ApiOutcome<Player>>
  signIn(request: SignInRequest): Promise<ApiOutcome<Player>>
  signOut(): Promise<ApiOutcome<undefined>>
  currentPlayer(): Promise<Player | undefined>
  fief(): Promise<ApiOutcome<FiefOverview>>
  enqueueUpgrade(building: BuildingKind): Promise<ApiOutcome<FiefOverview>>
  cancelUpgrade(): Promise<ApiOutcome<FiefOverview>>
}

const unexpected: ApiOutcome<never> = { ok: false, refusal: 'Unexpected' }

const refusalOf = async (response: Response): Promise<ApiOutcome<never>> => {
  const parsed = ApiErrorSchema.safeParse(await response.json().catch(() => undefined))
  return parsed.success ? { ok: false, refusal: parsed.data.kind } : unexpected
}

const bodyOf = async <T>(response: Response, schema: ZodType<T>): Promise<ApiOutcome<T>> => {
  if (!response.ok) {
    return refusalOf(response)
  }
  const parsed = schema.safeParse(await response.json().catch(() => undefined))
  return parsed.success ? { ok: true, value: parsed.data } : unexpected
}

const playerOf = (response: Response): Promise<ApiOutcome<Player>> => bodyOf(response, PlayerSchema)

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
    fief: async () => {
      const response = await send('/fief', { method: 'GET' })
      return response === undefined ? unexpected : bodyOf(response, FiefOverviewSchema)
    },
    enqueueUpgrade: async (building) => {
      const request: EnqueueBuildingRequest = { building }
      const response = await postJson('/fief/upgrades', request)
      return response === undefined ? unexpected : bodyOf(response, FiefOverviewSchema)
    },
    cancelUpgrade: async () => {
      const response = await send('/fief/upgrades', { method: 'DELETE' })
      return response === undefined ? unexpected : bodyOf(response, FiefOverviewSchema)
    },
  }
}
