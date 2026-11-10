import {
  type ApiError,
  type ApiErrorKind,
  ApiErrorSchema,
  type ForgotPasswordRequest,
  type FoundTown,
  type BuildingKind as PlaceKind,
  type Player,
  PlayerSchema,
  type Report,
  ReportSchema,
  type ResetPasswordRequest,
  type ReviewAnswer,
  type ReviewAnswerRequest,
  ReviewAnswerSchema,
  type ReviewHint,
  ReviewHintSchema,
  type Reviews,
  ReviewsSchema,
  type SignInRequest,
  type SignUpRequest,
  type StartBuildingWork,
  type StartLessonRequest,
  type StopBuildingWork,
  type TownOverview,
  TownOverviewSchema,
  type VerifyEmailRequest,
} from '@mygame/contracts'
import type { ZodType } from 'zod'

export type ApiRefusal = ApiErrorKind | 'Unexpected'

export type ApiOutcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly refusal: ApiRefusal; readonly error?: ApiError | undefined }

export interface ApiClient {
  signUp(request: SignUpRequest): Promise<ApiOutcome<Player>>
  signIn(request: SignInRequest): Promise<ApiOutcome<Player>>
  signOut(): Promise<ApiOutcome<undefined>>
  currentPlayer(): Promise<Player | undefined>
  town(): Promise<ApiOutcome<TownOverview>>
  foundTown(name: string): Promise<ApiOutcome<TownOverview>>
  startBuildingWork(place: PlaceKind): Promise<ApiOutcome<TownOverview>>
  stopBuildingWork(target: StopBuildingWork): Promise<ApiOutcome<TownOverview>>
  startLesson(lessonId: string): Promise<ApiOutcome<TownOverview>>
  stopLesson(lessonId: string): Promise<ApiOutcome<TownOverview>>
  reviews(): Promise<ApiOutcome<Reviews>>
  reviewHint(wordId: string): Promise<ApiOutcome<ReviewHint>>
  answerReview(answer: AnsweredReview): Promise<ApiOutcome<ReviewAnswer>>
  report(): Promise<ApiOutcome<Report>>
  closeReport(): Promise<ApiRefusal | undefined>
  verifyEmail(token: string): Promise<ApiRefusal | undefined>
  resendVerification(): Promise<ApiRefusal | undefined>
  forgotPassword(email: string): Promise<ApiRefusal | undefined>
  resetPassword(request: ResetPasswordRequest): Promise<ApiRefusal | undefined>
}

export interface AnsweredReview {
  readonly wordId: string
  readonly answer: string
}

const unexpected: ApiOutcome<never> = { ok: false, refusal: 'Unexpected' }

const refusalOf = async (response: Response): Promise<ApiOutcome<never>> => {
  const parsed = ApiErrorSchema.safeParse(await response.json().catch(() => undefined))
  return parsed.success ? { ok: false, refusal: parsed.data.kind, error: parsed.data } : unexpected
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
    town: async () => {
      const response = await send('/town', { method: 'GET' })
      return response === undefined ? unexpected : bodyOf(response, TownOverviewSchema)
    },
    foundTown: async (name) => {
      const request: FoundTown = { name }
      const response = await postJson('/town', request)
      return response === undefined ? unexpected : bodyOf(response, TownOverviewSchema)
    },
    startBuildingWork: async (building) => {
      const request: StartBuildingWork = { building }
      const response = await postJson('/town/work', request)
      return response === undefined ? unexpected : bodyOf(response, TownOverviewSchema)
    },
    stopBuildingWork: async ({ building, level }) => {
      const response = await send(`/town/work/${building}/${level}`, { method: 'DELETE' })
      return response === undefined ? unexpected : bodyOf(response, TownOverviewSchema)
    },
    startLesson: async (lessonId) => {
      const request: StartLessonRequest = { lessonId }
      const response = await postJson('/town/lessons', request)
      return response === undefined ? unexpected : bodyOf(response, TownOverviewSchema)
    },
    stopLesson: async (lessonId) => {
      const response = await send(`/town/lessons/${encodeURIComponent(lessonId)}`, {
        method: 'DELETE',
      })
      return response === undefined ? unexpected : bodyOf(response, TownOverviewSchema)
    },
    reviews: async () => {
      const response = await send('/reviews', { method: 'GET' })
      return response === undefined ? unexpected : bodyOf(response, ReviewsSchema)
    },
    reviewHint: async (wordId) => {
      const response = await send(`/reviews/${encodeURIComponent(wordId)}/hint`, {
        method: 'POST',
      })
      return response === undefined ? unexpected : bodyOf(response, ReviewHintSchema)
    },
    answerReview: async ({ wordId, answer }) => {
      const request: ReviewAnswerRequest = { answer }
      const response = await postJson(`/reviews/${encodeURIComponent(wordId)}/answer`, request)
      return response === undefined ? unexpected : bodyOf(response, ReviewAnswerSchema)
    },
    report: async () => {
      const response = await send('/report', { method: 'GET' })
      return response === undefined ? unexpected : bodyOf(response, ReportSchema)
    },
    closeReport: async () => refusalOrNothing(await send('/report/close', { method: 'POST' })),
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
