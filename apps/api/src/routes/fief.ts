import {
  CancelRecruitOrderRequestSchema,
  CancelStudyRequestSchema,
  CancelUpgradeRequestSchema,
  DispatchMarchRequestSchema,
  EnqueueBuildingRequestSchema,
  type FiefChronicle,
  type FiefOverview,
  PlaceRecruitOrderRequestSchema,
  RecallMarchRequestSchema,
  StartStudyRequestSchema,
} from '@mygame/contracts'
import type { DomainError, Fief, Result } from '@mygame/domain'
import { type Context, Hono } from 'hono'
import type { ChronicleReader } from '../fief/ChronicleReader'
import {
  type CancelRecruitOrderDependencies,
  cancelRecruitOrderOf,
} from '../fief/cancelRecruitOrderOf'
import { type CancelStudyDependencies, cancelStudyOf } from '../fief/cancelStudyOf'
import { type CancelUpgradeDependencies, cancelUpgradeOf } from '../fief/cancelUpgradeOf'
import { type CurrentFiefDependencies, currentFiefOf } from '../fief/currentFiefOf'
import { type DispatchMarchDependencies, dispatchMarchOf } from '../fief/dispatchMarchOf'
import { type EnqueueUpgradeDependencies, enqueueUpgradeOf } from '../fief/enqueueUpgradeOf'
import { fiefChronicleOf } from '../fief/fiefChronicleOf'
import { fiefOverviewOf } from '../fief/fiefOverviewOf'
import {
  type PlaceRecruitOrderDependencies,
  placeRecruitOrderOf,
} from '../fief/placeRecruitOrderOf'
import { type RecallMarchDependencies, recallMarchOf } from '../fief/recallMarchOf'
import { type StartStudyDependencies, startStudyOf } from '../fief/startStudyOf'
import { answerRefusal } from '../http/answerRefusal'
import { bodyOf } from '../http/bodyOf'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'

export type FiefDependencies = CurrentFiefDependencies &
  CancelUpgradeDependencies &
  CancelStudyDependencies &
  EnqueueUpgradeDependencies &
  StartStudyDependencies &
  PlaceRecruitOrderDependencies &
  CancelRecruitOrderDependencies &
  DispatchMarchDependencies &
  RecallMarchDependencies &
  RequirePlayerDependencies & {
    readonly chronicle: ChronicleReader
  }

export const fiefRoutes = (dependencies: FiefDependencies): Hono => {
  const answerFief = (c: Context, fief: Result<Fief, DomainError>): Response => {
    if (!fief.ok) {
      return answerRefusal(c, fief.error)
    }
    const overview = fiefOverviewOf(fief.value, dependencies.buildingCatalog)
    if (!overview.ok) {
      return answerRefusal(c, overview.error)
    }
    const body: FiefOverview = overview.value
    return c.json(body)
  }
  const signedInPlayer = requirePlayer(dependencies)
  return new Hono()
    .get('/', signedInPlayer, async (c) =>
      answerFief(c, await currentFiefOf(c.var.playerId, dependencies)),
    )
    .get('/events', signedInPlayer, async (c) => {
      const fief = await currentFiefOf(c.var.playerId, dependencies)
      if (!fief.ok) {
        return answerRefusal(c, fief.error)
      }
      const body: FiefChronicle = fiefChronicleOf(
        await dependencies.chronicle.eventsOf(fief.value.id),
      )
      return c.json(body)
    })
    .post('/upgrades', signedInPlayer, async (c) => {
      const request = EnqueueBuildingRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(
        c,
        await enqueueUpgradeOf(c.var.playerId, request.data.building, dependencies),
      )
    })
    .delete('/upgrades/:building/:targetLevel', signedInPlayer, async (c) => {
      const request = CancelUpgradeRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await cancelUpgradeOf(c.var.playerId, request.data, dependencies))
    })
    .post('/studies', signedInPlayer, async (c) => {
      const request = StartStudyRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await startStudyOf(c.var.playerId, request.data.art, dependencies))
    })
    .delete('/studies/:art/:targetLevel', signedInPlayer, async (c) => {
      const request = CancelStudyRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await cancelStudyOf(c.var.playerId, request.data, dependencies))
    })
    .post('/recruit-orders', signedInPlayer, async (c) => {
      const request = PlaceRecruitOrderRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await placeRecruitOrderOf(c.var.playerId, request.data, dependencies))
    })
    .delete('/recruit-orders/:unit/:startedAt', signedInPlayer, async (c) => {
      const request = CancelRecruitOrderRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await cancelRecruitOrderOf(c.var.playerId, request.data, dependencies))
    })
    .post('/marches', signedInPlayer, async (c) => {
      const request = DispatchMarchRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await dispatchMarchOf(c.var.playerId, request.data, dependencies))
    })
    .post('/marches/:departedAt/recall', signedInPlayer, async (c) => {
      const request = RecallMarchRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await recallMarchOf(c.var.playerId, request.data, dependencies))
    })
}
