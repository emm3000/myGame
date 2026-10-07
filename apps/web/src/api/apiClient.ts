import {
  type ApiErrorKind,
  ApiErrorSchema,
  type ArtKind,
  type BuildingKind,
  type CancelRecruitOrderRequest,
  type CancelStudyRequest,
  type CancelUpgradeRequest,
  type Digest,
  DigestSchema,
  type DispatchAttackRequest,
  type DispatchFoundingRequest,
  type DispatchMarchRequest,
  type DispatchTransportRequest,
  type EnqueueBuildingRequest,
  type FiefChronicle,
  FiefChronicleSchema,
  type FiefList,
  FiefListSchema,
  type FiefOverview,
  FiefOverviewSchema,
  type ForgotPasswordRequest,
  type PlaceRecruitOrderRequest,
  type Player,
  PlayerSchema,
  type ProvinceMap,
  ProvinceMapSchema,
  type RecallMarchRequest,
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
  | { readonly ok: false; readonly refusal: ApiRefusal; readonly message?: string | undefined }

export interface ApiClient {
  signUp(request: SignUpRequest): Promise<ApiOutcome<Player>>
  signIn(request: SignInRequest): Promise<ApiOutcome<Player>>
  signOut(): Promise<ApiOutcome<undefined>>
  currentPlayer(): Promise<Player | undefined>
  fiefs(): Promise<ApiOutcome<FiefList>>
  fief(fiefId: string): Promise<ApiOutcome<FiefOverview>>
  enqueueUpgrade(fiefId: string, building: BuildingKind): Promise<ApiOutcome<FiefOverview>>
  cancelUpgrade(fiefId: string, target: CancelUpgradeRequest): Promise<ApiOutcome<FiefOverview>>
  startStudy(fiefId: string, art: ArtKind): Promise<ApiOutcome<FiefOverview>>
  cancelStudy(fiefId: string, target: CancelStudyRequest): Promise<ApiOutcome<FiefOverview>>
  placeRecruitOrder(
    fiefId: string,
    request: PlaceRecruitOrderRequest,
  ): Promise<ApiOutcome<FiefOverview>>
  cancelRecruitOrder(
    fiefId: string,
    target: CancelRecruitOrderRequest,
  ): Promise<ApiOutcome<FiefOverview>>
  dispatchMarch(fiefId: string, request: DispatchMarchRequest): Promise<ApiOutcome<FiefOverview>>
  dispatchAttack(fiefId: string, request: DispatchAttackRequest): Promise<ApiOutcome<FiefOverview>>
  dispatchFounding(
    fiefId: string,
    request: DispatchFoundingRequest,
  ): Promise<ApiOutcome<FiefOverview>>
  dispatchTransport(
    fiefId: string,
    request: DispatchTransportRequest,
  ): Promise<ApiOutcome<FiefOverview>>
  recallMarch(fiefId: string, target: RecallMarchRequest): Promise<ApiOutcome<FiefOverview>>
  chronicle(fiefId: string): Promise<ApiOutcome<FiefChronicle>>
  provinceMap(fiefId: string, province?: number): Promise<ApiOutcome<ProvinceMap>>
  digest(): Promise<ApiOutcome<Digest>>
  acknowledgeDigest(): Promise<ApiRefusal | undefined>
  dismissGuidance(fiefId: string): Promise<ApiRefusal | undefined>
  verifyEmail(token: string): Promise<ApiRefusal | undefined>
  resendVerification(): Promise<ApiRefusal | undefined>
  forgotPassword(email: string): Promise<ApiRefusal | undefined>
  resetPassword(request: ResetPasswordRequest): Promise<ApiRefusal | undefined>
}

const unexpected: ApiOutcome<never> = { ok: false, refusal: 'Unexpected' }

const refusalOf = async (response: Response): Promise<ApiOutcome<never>> => {
  const parsed = ApiErrorSchema.safeParse(await response.json().catch(() => undefined))
  return parsed.success
    ? { ok: false, refusal: parsed.data.kind, message: parsed.data.message }
    : unexpected
}

const refusalKindOf = async (response: Response): Promise<ApiRefusal> => {
  const outcome = await refusalOf(response)
  return outcome.ok ? 'Unexpected' : outcome.refusal
}

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

const fiefPathOf = (fiefId: string, path: string): string =>
  `/fiefs/${encodeURIComponent(fiefId)}${path}`

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
    fiefs: async () => {
      const response = await send('/fiefs', { method: 'GET' })
      return response === undefined ? unexpected : bodyOf(response, FiefListSchema)
    },
    fief: async (fiefId) => {
      const response = await send(fiefPathOf(fiefId, ''), { method: 'GET' })
      return response === undefined ? unexpected : bodyOf(response, FiefOverviewSchema)
    },
    enqueueUpgrade: async (fiefId, building) => {
      const request: EnqueueBuildingRequest = { building }
      const response = await postJson(fiefPathOf(fiefId, '/upgrades'), request)
      return response === undefined ? unexpected : bodyOf(response, FiefOverviewSchema)
    },
    cancelUpgrade: async (fiefId, { building, targetLevel }) => {
      const response = await send(fiefPathOf(fiefId, `/upgrades/${building}/${targetLevel}`), {
        method: 'DELETE',
      })
      return response === undefined ? unexpected : bodyOf(response, FiefOverviewSchema)
    },
    startStudy: async (fiefId, art) => {
      const request: StartStudyRequest = { art }
      const response = await postJson(fiefPathOf(fiefId, '/studies'), request)
      return response === undefined ? unexpected : bodyOf(response, FiefOverviewSchema)
    },
    cancelStudy: async (fiefId, { art, targetLevel }) => {
      const response = await send(fiefPathOf(fiefId, `/studies/${art}/${targetLevel}`), {
        method: 'DELETE',
      })
      return response === undefined ? unexpected : bodyOf(response, FiefOverviewSchema)
    },
    placeRecruitOrder: async (fiefId, { unit, count }) => {
      const request: PlaceRecruitOrderRequest = { unit, count }
      const response = await postJson(fiefPathOf(fiefId, '/recruit-orders'), request)
      return response === undefined ? unexpected : bodyOf(response, FiefOverviewSchema)
    },
    cancelRecruitOrder: async (fiefId, { unit, startedAt }) => {
      const response = await send(
        fiefPathOf(fiefId, `/recruit-orders/${unit}/${encodeURIComponent(startedAt)}`),
        {
          method: 'DELETE',
        },
      )
      return response === undefined ? unexpected : bodyOf(response, FiefOverviewSchema)
    },
    dispatchMarch: async (fiefId, { province, plot, units, stayHours }) => {
      const request: DispatchMarchRequest = { province, plot, units, stayHours }
      const response = await postJson(fiefPathOf(fiefId, '/marches'), request)
      return response === undefined ? unexpected : bodyOf(response, FiefOverviewSchema)
    },
    dispatchAttack: async (fiefId, { province, plot, units }) => {
      const request: DispatchAttackRequest = { province, plot, units }
      const response = await postJson(fiefPathOf(fiefId, '/marches/attack'), request)
      return response === undefined ? unexpected : bodyOf(response, FiefOverviewSchema)
    },
    dispatchFounding: async (fiefId, { province, plot, name }) => {
      const request: DispatchFoundingRequest = { province, plot, name }
      const response = await postJson(fiefPathOf(fiefId, '/marches/found'), request)
      return response === undefined ? unexpected : bodyOf(response, FiefOverviewSchema)
    },
    dispatchTransport: async (fiefId, { toFiefId, units, cargo }) => {
      const request: DispatchTransportRequest = { toFiefId, units, cargo }
      const response = await postJson(fiefPathOf(fiefId, '/marches/transport'), request)
      return response === undefined ? unexpected : bodyOf(response, FiefOverviewSchema)
    },
    recallMarch: async (fiefId, { departedAt }) => {
      const response = await send(
        fiefPathOf(fiefId, `/marches/${encodeURIComponent(departedAt)}/recall`),
        {
          method: 'POST',
        },
      )
      return response === undefined ? unexpected : bodyOf(response, FiefOverviewSchema)
    },
    chronicle: async (fiefId) => {
      const response = await send(fiefPathOf(fiefId, '/events'), { method: 'GET' })
      return response === undefined ? unexpected : bodyOf(response, FiefChronicleSchema)
    },
    provinceMap: async (fiefId, province) => {
      const provincePath = province === undefined ? '' : `/${province}`
      const response = await send(fiefPathOf(fiefId, `/map${provincePath}`), { method: 'GET' })
      return response === undefined ? unexpected : bodyOf(response, ProvinceMapSchema)
    },
    digest: async () => {
      const response = await send('/digest', { method: 'GET' })
      return response === undefined ? unexpected : bodyOf(response, DigestSchema)
    },
    acknowledgeDigest: async () =>
      refusalOrNothing(await send('/digest/acknowledgement', { method: 'POST' })),
    dismissGuidance: async (fiefId) =>
      refusalOrNothing(await send(fiefPathOf(fiefId, '/guidance/dismissal'), { method: 'POST' })),
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
