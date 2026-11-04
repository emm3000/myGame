import { OpenAPIHono } from '@hono/zod-openapi'
import {
  CancelLessonRequestSchema,
  CancelRecruitOrderRequestSchema,
  CancelStudyRequestSchema,
  CancelUpgradeRequestSchema,
  DispatchAttackRequestSchema,
  DispatchFoundingRequestSchema,
  DispatchMarchRequestSchema,
  DispatchTransportRequestSchema,
  EnqueueBuildingRequestSchema,
  type FiefChronicle,
  PlaceRecruitOrderRequestSchema,
  RecallMarchRequestSchema,
  type ReviewAnswer,
  ReviewAnswerRequestSchema,
  type ReviewHint,
  ReviewRequestSchema,
  StartLessonRequestSchema,
  StartStudyRequestSchema,
} from '@mygame/contracts'
import type { DomainError, Fief, Result } from '@mygame/domain'
import type { Context } from 'hono'
import type { ChronicleReader } from '../fief/ChronicleReader'
import {
  type CancelRecruitOrderDependencies,
  cancelRecruitOrderOf,
} from '../fief/cancelRecruitOrderOf'
import { type CancelStudyDependencies, cancelStudyOf } from '../fief/cancelStudyOf'
import { type CancelUpgradeDependencies, cancelUpgradeOf } from '../fief/cancelUpgradeOf'
import { type CurrentFiefDependencies, currentFiefOf } from '../fief/currentFiefOf'
import { type DispatchAttackDependencies, dispatchAttackOf } from '../fief/dispatchAttackOf'
import { type DispatchFoundingDependencies, dispatchFoundingOf } from '../fief/dispatchFoundingOf'
import { type DispatchMarchDependencies, dispatchMarchOf } from '../fief/dispatchMarchOf'
import {
  type DispatchTransportDependencies,
  dispatchTransportOf,
} from '../fief/dispatchTransportOf'
import { type EnqueueUpgradeDependencies, enqueueUpgradeOf } from '../fief/enqueueUpgradeOf'
import type { FiefReading } from '../fief/FiefReading'
import { fiefChronicleOf } from '../fief/fiefChronicleOf'
import {
  type PlaceRecruitOrderDependencies,
  placeRecruitOrderOf,
} from '../fief/placeRecruitOrderOf'
import { type RecallMarchDependencies, recallMarchOf } from '../fief/recallMarchOf'
import { type StartStudyDependencies, startStudyOf } from '../fief/startStudyOf'
import { storedFiefReadingOf } from '../fief/storedFiefReadingOf'
import type { GuidanceDismissals } from '../guidance/GuidanceDismissals'
import { answerOverview, type OverviewDependencies, overviewOfPlayer } from '../http/answerOverview'
import { answerRefusal } from '../http/answerRefusal'
import { bodyOf } from '../http/bodyOf'
import { honoPathOf } from '../http/honoPath'
import { type NamedIssue, requestRefusalOf } from '../http/requestRefusalOf'
import { type NamedFief, requireNamedFief } from '../http/requireNamedFief'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'
import { answerReviewOf } from '../learning/answerReviewOf'
import { cancelLessonOf } from '../learning/cancelLessonOf'
import type { LearningDependencies } from '../learning/LearningDependencies'
import { requestHintOf } from '../learning/requestHintOf'
import { reviewVerdictOf } from '../learning/reviewVerdictOf'
import { startLessonOf } from '../learning/startLessonOf'
import { fiefDeclarations } from './fiefDeclarations'

const foundingIssues: ReadonlyArray<NamedIssue> = [['name', 'too_small', { kind: 'BlankFiefName' }]]

export type FiefDependencies = CurrentFiefDependencies &
  CancelUpgradeDependencies &
  CancelStudyDependencies &
  EnqueueUpgradeDependencies &
  StartStudyDependencies &
  PlaceRecruitOrderDependencies &
  CancelRecruitOrderDependencies &
  DispatchMarchDependencies &
  DispatchAttackDependencies &
  DispatchFoundingDependencies &
  DispatchTransportDependencies &
  RecallMarchDependencies &
  RequirePlayerDependencies &
  OverviewDependencies &
  LearningDependencies & {
    readonly chronicle: ChronicleReader
    readonly guidanceDismissals: GuidanceDismissals
  }

export const fiefRoutes = (dependencies: FiefDependencies): OpenAPIHono => {
  const answerReading = (
    c: Context<NamedFief>,
    reading: Result<FiefReading, DomainError>,
  ): Promise<Response> => answerOverview(c, c.var.fiefOfPlayer.playerId, reading, dependencies)
  const answerFief = (c: Context<NamedFief>, fief: Result<Fief, DomainError>): Promise<Response> =>
    answerReading(c, fief.ok ? storedFiefReadingOf(fief.value, dependencies.buildingCatalog) : fief)
  const signedInPlayer = requirePlayer(dependencies)
  const routes = new OpenAPIHono()
  for (const declaration of Object.values(fiefDeclarations)) {
    routes.openAPIRegistry.registerPath(declaration)
  }
  routes.on(
    fiefDeclarations.overview.method,
    honoPathOf(fiefDeclarations.overview),
    signedInPlayer,
    requireNamedFief,
    async (c) => answerReading(c, await currentFiefOf(c.var.fiefOfPlayer, dependencies)),
  )
  routes.on(
    fiefDeclarations.events.method,
    honoPathOf(fiefDeclarations.events),
    signedInPlayer,
    requireNamedFief,
    async (c) => {
      const reading = await currentFiefOf(c.var.fiefOfPlayer, dependencies)
      if (!reading.ok) {
        return answerRefusal(c, reading.error)
      }
      const body: FiefChronicle = fiefChronicleOf(
        await dependencies.chronicle.eventsOf(reading.value.fief.id),
      )
      return c.json(body)
    },
  )
  routes.on(
    fiefDeclarations.enqueueUpgrade.method,
    honoPathOf(fiefDeclarations.enqueueUpgrade),
    signedInPlayer,
    requireNamedFief,
    async (c) => {
      const request = EnqueueBuildingRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(
        c,
        await enqueueUpgradeOf(c.var.fiefOfPlayer, request.data.building, dependencies),
      )
    },
  )
  routes.on(
    fiefDeclarations.cancelUpgrade.method,
    honoPathOf(fiefDeclarations.cancelUpgrade),
    signedInPlayer,
    requireNamedFief,
    async (c) => {
      const request = CancelUpgradeRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await cancelUpgradeOf(c.var.fiefOfPlayer, request.data, dependencies))
    },
  )
  routes.on(
    fiefDeclarations.startStudy.method,
    honoPathOf(fiefDeclarations.startStudy),
    signedInPlayer,
    requireNamedFief,
    async (c) => {
      const request = StartStudyRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await startStudyOf(c.var.fiefOfPlayer, request.data.art, dependencies))
    },
  )
  routes.on(
    fiefDeclarations.cancelStudy.method,
    honoPathOf(fiefDeclarations.cancelStudy),
    signedInPlayer,
    requireNamedFief,
    async (c) => {
      const request = CancelStudyRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await cancelStudyOf(c.var.fiefOfPlayer, request.data, dependencies))
    },
  )
  routes.on(
    fiefDeclarations.placeRecruitOrder.method,
    honoPathOf(fiefDeclarations.placeRecruitOrder),
    signedInPlayer,
    requireNamedFief,
    async (c) => {
      const request = PlaceRecruitOrderRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(
        c,
        await placeRecruitOrderOf(c.var.fiefOfPlayer, request.data, dependencies),
      )
    },
  )
  routes.on(
    fiefDeclarations.cancelRecruitOrder.method,
    honoPathOf(fiefDeclarations.cancelRecruitOrder),
    signedInPlayer,
    requireNamedFief,
    async (c) => {
      const request = CancelRecruitOrderRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(
        c,
        await cancelRecruitOrderOf(c.var.fiefOfPlayer, request.data, dependencies),
      )
    },
  )
  routes.on(
    fiefDeclarations.dispatchMarch.method,
    honoPathOf(fiefDeclarations.dispatchMarch),
    signedInPlayer,
    requireNamedFief,
    async (c) => {
      const request = DispatchMarchRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await dispatchMarchOf(c.var.fiefOfPlayer, request.data, dependencies))
    },
  )
  routes.on(
    fiefDeclarations.dispatchAttack.method,
    honoPathOf(fiefDeclarations.dispatchAttack),
    signedInPlayer,
    requireNamedFief,
    async (c) => {
      const request = DispatchAttackRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await dispatchAttackOf(c.var.fiefOfPlayer, request.data, dependencies))
    },
  )
  routes.on(
    fiefDeclarations.dispatchFounding.method,
    honoPathOf(fiefDeclarations.dispatchFounding),
    signedInPlayer,
    requireNamedFief,
    async (c) => {
      const request = DispatchFoundingRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, requestRefusalOf(foundingIssues, request.error.issues))
      }
      return answerFief(c, await dispatchFoundingOf(c.var.fiefOfPlayer, request.data, dependencies))
    },
  )
  routes.on(
    fiefDeclarations.dispatchTransport.method,
    honoPathOf(fiefDeclarations.dispatchTransport),
    signedInPlayer,
    requireNamedFief,
    async (c) => {
      const request = DispatchTransportRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(
        c,
        await dispatchTransportOf(c.var.fiefOfPlayer, request.data, dependencies),
      )
    },
  )
  routes.on(
    fiefDeclarations.recallMarch.method,
    honoPathOf(fiefDeclarations.recallMarch),
    signedInPlayer,
    requireNamedFief,
    async (c) => {
      const request = RecallMarchRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await recallMarchOf(c.var.fiefOfPlayer, request.data, dependencies))
    },
  )
  routes.on(
    fiefDeclarations.startLesson.method,
    honoPathOf(fiefDeclarations.startLesson),
    signedInPlayer,
    requireNamedFief,
    async (c) => {
      const request = StartLessonRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerReading(
        c,
        await startLessonOf(c.var.fiefOfPlayer, request.data.lessonId, dependencies),
      )
    },
  )
  routes.on(
    fiefDeclarations.cancelLesson.method,
    honoPathOf(fiefDeclarations.cancelLesson),
    signedInPlayer,
    requireNamedFief,
    async (c) => {
      const request = CancelLessonRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerReading(
        c,
        await cancelLessonOf(c.var.fiefOfPlayer, request.data.lessonId, dependencies),
      )
    },
  )
  routes.on(
    fiefDeclarations.requestHint.method,
    honoPathOf(fiefDeclarations.requestHint),
    signedInPlayer,
    requireNamedFief,
    async (c) => {
      const request = ReviewRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const hint = await requestHintOf(c.var.fiefOfPlayer, request.data.wordId, dependencies)
      if (!hint.ok) {
        return answerRefusal(c, hint.error)
      }
      const body: ReviewHint = hint.value
      return c.json(body)
    },
  )
  routes.on(
    fiefDeclarations.answerReview.method,
    honoPathOf(fiefDeclarations.answerReview),
    signedInPlayer,
    requireNamedFief,
    async (c) => {
      const path = ReviewRequestSchema.safeParse(c.req.param())
      const request = ReviewAnswerRequestSchema.safeParse(await bodyOf(c))
      if (!path.success || !request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      const { fiefOfPlayer } = c.var
      const outcome = await answerReviewOf(
        fiefOfPlayer,
        path.data.wordId,
        request.data.answer,
        dependencies,
      )
      if (!outcome.ok) {
        return answerRefusal(c, outcome.error)
      }
      const verdict = reviewVerdictOf(
        outcome.value,
        dependencies.buildingCatalog,
        dependencies.memoryTerms,
      )
      if (!verdict.ok) {
        return answerRefusal(c, verdict.error)
      }
      const fief = await overviewOfPlayer(
        fiefOfPlayer.playerId,
        outcome.value.reading,
        dependencies,
      )
      if (!fief.ok) {
        return answerRefusal(c, fief.error)
      }
      const body: ReviewAnswer = { verdict: verdict.value, fief: fief.value }
      return c.json(body)
    },
  )
  routes.on(
    fiefDeclarations.dismissGuidance.method,
    honoPathOf(fiefDeclarations.dismissGuidance),
    signedInPlayer,
    requireNamedFief,
    async (c) => {
      const { fiefOfPlayer } = c.var
      const dismissal = await dependencies.guidanceDismissals.dismiss(
        fiefOfPlayer,
        dependencies.clock.now(),
      )
      if (dismissal === 'fiefNotFound') {
        return answerRefusal(c, { kind: 'FiefNotFound', fiefId: fiefOfPlayer.fiefId })
      }
      return c.body(null, 204)
    },
  )
  return routes
}
