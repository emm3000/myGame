import {
  type ApiErrorKind,
  ApiErrorSchema,
  type ArtKind,
  type BuildingKind,
  type CancelStudyRequest,
  type CancelUpgradeRequest,
  type EnqueueBuildingRequest,
  type FiefChronicle,
  FiefChronicleSchema,
  type FiefOverview,
  FiefOverviewSchema,
  type ForgotPasswordRequest,
  type Player,
  PlayerSchema,
  type ProvinceMap,
  ProvinceMapSchema,
  type ResetPasswordRequest,
  type SignInRequest,
  type SignUpRequest,
  type StartStudyRequest,
  type VerifyEmailRequest,
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
  cancelUpgrade(target: CancelUpgradeRequest): Promise<ApiOutcome<FiefOverview>>
  startStudy(art: ArtKind): Promise<ApiOutcome<FiefOverview>>
  cancelStudy(target: CancelStudyRequest): Promise<ApiOutcome<FiefOverview>>
  chronicle(): Promise<ApiOutcome<FiefChronicle>>
  provinceMap(province?: number): Promise<ApiOutcome<ProvinceMap>>
  verifyEmail(token: string): Promise<ApiRefusal | undefined>
  resendVerification(): Promise<ApiRefusal | undefined>
  forgotPassword(email: string): Promise<ApiRefusal | undefined>
  resetPassword(request: ResetPasswordRequest): Promise<ApiRefusal | undefined>
}

const unexpected: ApiOutcome<never> = { ok: false, refusal: 'Unexpected' }

const refusalKindOf = async (response: Response): Promise<ApiRefusal> => {
  const parsed = ApiErrorSchema.safeParse(await response.json().catch(() => undefined))
  return parsed.success ? parsed.data.kind : 'Unexpected'
}

const refusalOf = async (response: Response): Promise<ApiOutcome<never>> => ({
  ok: false,
  refusal: await refusalKindOf(response),
})

const bodyOf = async <T>(response: Response, schema: ZodType<T>): Promise<ApiOutcome<T>> => {
  if (!response.ok) {
    return refusalOf(response)
  }
  const parsed = schema.safeParse(await response.json().catch(() => undefined))
  return parsed.success ? { ok: true, value: parsed.data } : unexpected
}

const refusalOrNothing = async (
  response: Response | undefined,
): Promise<ApiRefusal | undefined> => {
  if (response === undefined) {
    return 'Unexpected'
  }
  return response.ok ? undefined : refusalKindOf(response)
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
    cancelUpgrade: async ({ building, targetLevel }) => {
      const response = await send(`/fief/upgrades/${building}/${targetLevel}`, {
        method: 'DELETE',
      })
      return response === undefined ? unexpected : bodyOf(response, FiefOverviewSchema)
    },
    startStudy: async (art) => {
      const request: StartStudyRequest = { art }
      const response = await postJson('/fief/studies', request)
      return response === undefined ? unexpected : bodyOf(response, FiefOverviewSchema)
    },
    cancelStudy: async ({ art, targetLevel }) => {
      const response = await send(`/fief/studies/${art}/${targetLevel}`, { method: 'DELETE' })
      return response === undefined ? unexpected : bodyOf(response, FiefOverviewSchema)
    },
    chronicle: async () => {
      const response = await send('/fief/events', { method: 'GET' })
      return response === undefined ? unexpected : bodyOf(response, FiefChronicleSchema)
    },
    provinceMap: async (province) => {
      const path = province === undefined ? '/map' : `/map/${province}`
      const response = await send(path, { method: 'GET' })
      return response === undefined ? unexpected : bodyOf(response, ProvinceMapSchema)
    },
    verifyEmail: async (token) => {
      const request: VerifyEmailRequest = { token }
      return refusalOrNothing(await postJson('/auth/verify-email', request))
    },
    resendVerification: async () =>
      refusalOrNothing(await send('/auth/verify-email/resend', { method: 'POST' })),
    forgotPassword: async (email) => {
      const request: ForgotPasswordRequest = { email }
      return refusalOrNothing(await postJson('/auth/forgot-password', request))
    },
    resetPassword: async (request) =>
      refusalOrNothing(await postJson('/auth/reset-password', request)),
  }
}
