import {
  CancelRecruitOrderRequestSchema,
  CancelStudyRequestSchema,
  CancelUpgradeRequestSchema,
  DispatchAttackRequestSchema,
  DispatchFoundingRequestSchema,
  DispatchMarchRequestSchema,
  DispatchTransportRequestSchema,
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
import { fiefOverviewOf } from '../fief/fiefOverviewOf'
import {
  type PlaceRecruitOrderDependencies,
  placeRecruitOrderOf,
} from '../fief/placeRecruitOrderOf'
import { type RecallMarchDependencies, recallMarchOf } from '../fief/recallMarchOf'
import { type StartStudyDependencies, startStudyOf } from '../fief/startStudyOf'
import { storedFiefReadingOf } from '../fief/storedFiefReadingOf'
import type { GuidanceDismissals } from '../guidance/GuidanceDismissals'
import { answerRefusal, type RefusalLines, transportLines } from '../http/answerRefusal'
import { bodyOf } from '../http/bodyOf'
import { requireNamedFief } from '../http/requireNamedFief'
import { type RequirePlayerDependencies, requirePlayer } from '../http/requirePlayer'

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
  RequirePlayerDependencies & {
    readonly chronicle: ChronicleReader
    readonly guidanceDismissals: GuidanceDismissals
  }

export const fiefRoutes = (dependencies: FiefDependencies): Hono => {
  const answerReading = (
    c: Context,
    reading: Result<FiefReading, DomainError>,
    lines: RefusalLines = {},
  ): Response => {
    if (!reading.ok) {
      return answerRefusal(c, reading.error, lines)
    }
    const overview = fiefOverviewOf(reading.value, dependencies.buildingCatalog)
    if (!overview.ok) {
      return answerRefusal(c, overview.error)
    }
    const body: FiefOverview = overview.value
    return c.json(body)
  }
  const answerFief = (
    c: Context,
    fief: Result<Fief, DomainError>,
    lines: RefusalLines = {},
  ): Response =>
    answerReading(
      c,
      fief.ok ? storedFiefReadingOf(fief.value, dependencies.buildingCatalog) : fief,
      lines,
    )
  const signedInPlayer = requirePlayer(dependencies)
  return new Hono()
    .get('/', signedInPlayer, requireNamedFief, async (c) =>
      answerReading(c, await currentFiefOf(c.var.fiefOfPlayer, dependencies)),
    )
    .get('/events', signedInPlayer, requireNamedFief, async (c) => {
      const reading = await currentFiefOf(c.var.fiefOfPlayer, dependencies)
      if (!reading.ok) {
        return answerRefusal(c, reading.error)
      }
      const body: FiefChronicle = fiefChronicleOf(
        await dependencies.chronicle.eventsOf(reading.value.fief.id),
      )
      return c.json(body)
    })
    .post('/upgrades', signedInPlayer, requireNamedFief, async (c) => {
      const request = EnqueueBuildingRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(
        c,
        await enqueueUpgradeOf(c.var.fiefOfPlayer, request.data.building, dependencies),
      )
    })
    .delete('/upgrades/:building/:targetLevel', signedInPlayer, requireNamedFief, async (c) => {
      const request = CancelUpgradeRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await cancelUpgradeOf(c.var.fiefOfPlayer, request.data, dependencies))
    })
    .post('/studies', signedInPlayer, requireNamedFief, async (c) => {
      const request = StartStudyRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await startStudyOf(c.var.fiefOfPlayer, request.data.art, dependencies))
    })
    .delete('/studies/:art/:targetLevel', signedInPlayer, requireNamedFief, async (c) => {
      const request = CancelStudyRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await cancelStudyOf(c.var.fiefOfPlayer, request.data, dependencies))
    })
    .post('/recruit-orders', signedInPlayer, requireNamedFief, async (c) => {
      const request = PlaceRecruitOrderRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(
        c,
        await placeRecruitOrderOf(c.var.fiefOfPlayer, request.data, dependencies),
      )
    })
    .delete('/recruit-orders/:unit/:startedAt', signedInPlayer, requireNamedFief, async (c) => {
      const request = CancelRecruitOrderRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(
        c,
        await cancelRecruitOrderOf(c.var.fiefOfPlayer, request.data, dependencies),
      )
    })
    .post('/marches', signedInPlayer, requireNamedFief, async (c) => {
      const request = DispatchMarchRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await dispatchMarchOf(c.var.fiefOfPlayer, request.data, dependencies))
    })
    .post('/marches/attack', signedInPlayer, requireNamedFief, async (c) => {
      const request = DispatchAttackRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await dispatchAttackOf(c.var.fiefOfPlayer, request.data, dependencies))
    })
    .post('/marches/found', signedInPlayer, requireNamedFief, async (c) => {
      const request = DispatchFoundingRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await dispatchFoundingOf(c.var.fiefOfPlayer, request.data, dependencies))
    })
    .post('/marches/transport', signedInPlayer, requireNamedFief, async (c) => {
      const request = DispatchTransportRequestSchema.safeParse(await bodyOf(c))
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(
        c,
        await dispatchTransportOf(c.var.fiefOfPlayer, request.data, dependencies),
        transportLines,
      )
    })
    .post('/marches/:departedAt/recall', signedInPlayer, requireNamedFief, async (c) => {
      const request = RecallMarchRequestSchema.safeParse(c.req.param())
      if (!request.success) {
        return answerRefusal(c, { kind: 'MalformedRequest' })
      }
      return answerFief(c, await recallMarchOf(c.var.fiefOfPlayer, request.data, dependencies))
    })
    .post('/guidance/dismissal', signedInPlayer, requireNamedFief, async (c) => {
      const { fiefOfPlayer } = c.var
      const dismissal = await dependencies.guidanceDismissals.dismiss(
        fiefOfPlayer,
        dependencies.clock.now(),
      )
      if (dismissal === 'fiefNotFound') {
        return answerRefusal(c, { kind: 'FiefNotFound', fiefId: fiefOfPlayer.fiefId })
      }
      return c.body(null, 204)
    })
}
