import { type Battle, battleOf } from '../camp/battleOf'
import type { CampBattle } from '../camp/CampBattle'
import type { DomainError } from '../DomainError'
import type { BusySlot } from '../fief/BuildSlot'
import type { ChangedFief } from '../fief/ChangedFief'
import type { Fief, Stocks } from '../fief/Fief'
import type { FiefEvent } from '../fief/FiefEvent'
import { isSlotFinishedBy } from '../fief/isSlotFinishedBy'
import { materializeStocks } from '../fief/materializeStocks'
import type { OpenRecruitOrder } from '../fief/RecruitOrder'
import { recruitOrderEndsAt } from '../fief/recruitOrderEndsAt'
import type { BusyStudySlot } from '../fief/StudySlot'
import type { AttackMarch, AwayMarch } from '../march/March'
import { marchInstantsOf } from '../march/marchInstantsOf'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import type { CampRegistry } from '../ports/CampRegistry'
import type { ChronicleWriter } from '../ports/ChronicleWriter'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'

export type ResolveUpgradeCommand = {
  readonly playerId: PlayerId
}

export type ResolveUpgradeDependencies = {
  readonly fiefs: FiefRepository
  readonly chronicle: ChronicleWriter
  readonly camps: CampRegistry
  readonly catalog: BuildingCatalog
  readonly clock: Clock
}

export type ResolvedFief = ChangedFief & {
  readonly hasChanged: boolean
}

type FinishedWork =
  | { readonly kind: 'upgrade'; readonly slot: BusySlot; readonly finishedAt: Instant }
  | { readonly kind: 'study'; readonly slot: BusyStudySlot; readonly finishedAt: Instant }
  | { readonly kind: 'recruit'; readonly order: OpenRecruitOrder; readonly finishedAt: Instant }
  | {
      readonly kind: 'battle'
      readonly march: AttackMarch
      readonly battle: Battle
      readonly finishedAt: Instant
    }
  | { readonly kind: 'march'; readonly march: AwayMarch; readonly finishedAt: Instant }

type WalkedFief = ChangedFief & {
  readonly campBattles: ReadonlyArray<CampBattle>
}

const finishedUpgradeOf = (fief: Fief, now: Instant): FinishedWork | undefined => {
  const { slot } = fief
  if (slot.kind === 'idle' || !isSlotFinishedBy(slot, now)) {
    return undefined
  }
  return { kind: 'upgrade', slot, finishedAt: slot.finishesAt }
}

const finishedStudyOf = (fief: Fief, now: Instant): FinishedWork | undefined => {
  const { studySlot } = fief
  if (studySlot.kind === 'idle' || !isSlotFinishedBy(studySlot, now)) {
    return undefined
  }
  return { kind: 'study', slot: studySlot, finishedAt: studySlot.finishesAt }
}

const endedRecruitOrderOf = (fief: Fief, now: Instant): FinishedWork | undefined => {
  const { recruitOrder } = fief
  if (recruitOrder.kind === 'idle') {
    return undefined
  }
  const endsAt = recruitOrderEndsAt(recruitOrder)
  if (endsAt.epochMilliseconds > now.epochMilliseconds) {
    return undefined
  }
  return { kind: 'recruit', order: recruitOrder, finishedAt: endsAt }
}

const foughtBattleOf = (
  fief: Fief,
  now: Instant,
  infantryStrength: number,
): FinishedWork | undefined => {
  const { march } = fief
  if (
    march.kind === 'idle' ||
    march.order !== 'attack' ||
    march.fought ||
    march.recalledAt !== undefined
  ) {
    return undefined
  }
  const { arrivesAt } = marchInstantsOf(march)
  if (arrivesAt.epochMilliseconds > now.epochMilliseconds) {
    return undefined
  }
  const battle = battleOf(march.infantry, march.camp.strength, infantryStrength)
  return { kind: 'battle', march, battle, finishedAt: arrivesAt }
}

const returnedMarchOf = (fief: Fief, now: Instant): FinishedWork | undefined => {
  const { march } = fief
  if (march.kind === 'idle') {
    return undefined
  }
  const { returnsAt } = marchInstantsOf(march)
  if (returnsAt.epochMilliseconds > now.epochMilliseconds) {
    return undefined
  }
  return { kind: 'march', march, finishedAt: returnsAt }
}

const earlierOf = (
  earliest: FinishedWork | undefined,
  candidate: FinishedWork | undefined,
): FinishedWork | undefined => {
  if (earliest === undefined || candidate === undefined) {
    return earliest ?? candidate
  }
  const candidateFinishesFirst =
    candidate.finishedAt.epochMilliseconds < earliest.finishedAt.epochMilliseconds
  return candidateFinishesFirst ? candidate : earliest
}

const earliestFinishedOf = (
  fief: Fief,
  now: Instant,
  infantryStrength: number,
): FinishedWork | undefined =>
  [
    finishedUpgradeOf(fief, now),
    finishedStudyOf(fief, now),
    endedRecruitOrderOf(fief, now),
    foughtBattleOf(fief, now, infantryStrength),
    returnedMarchOf(fief, now),
  ].reduce(earlierOf, undefined)

const eventsOf = (finished: FinishedWork): ReadonlyArray<FiefEvent> => {
  switch (finished.kind) {
    case 'upgrade':
      return [
        {
          kind: 'upgradeFinished',
          building: finished.slot.building,
          level: finished.slot.targetLevel,
          occurredAt: finished.finishedAt,
        },
      ]
    case 'study':
      return [
        {
          kind: 'artLearned',
          art: finished.slot.art,
          level: finished.slot.targetLevel,
          occurredAt: finished.finishedAt,
        },
      ]
    case 'recruit':
      return [
        {
          kind: 'recruitsDelivered',
          unit: finished.order.unit,
          count: finished.order.count,
          occurredAt: finished.finishedAt,
        },
      ]
    case 'battle':
      return [
        {
          kind: 'battleFought',
          province: finished.march.province,
          plot: finished.march.plot,
          tier: finished.march.camp.tier,
          won: finished.battle.won,
          infantryLost: finished.battle.infantryLost,
          campLost: finished.battle.campLost,
          occurredAt: finished.finishedAt,
        },
      ]
    case 'march':
      return [
        {
          kind: 'marchReturned',
          province: finished.march.province,
          plot: finished.march.plot,
          infantry: finished.march.infantry,
          loot: finished.march.loot,
          recalled: finished.march.recalledAt !== undefined,
          occurredAt: finished.finishedAt,
        },
      ]
    default: {
      const unreachable: never = finished
      return unreachable
    }
  }
}

const campBattlesOf = (finished: FinishedWork, kingdom: number): ReadonlyArray<CampBattle> => {
  if (finished.kind !== 'battle') {
    return []
  }
  const { march, battle, finishedAt } = finished
  return [
    {
      kingdom,
      province: march.province,
      plot: march.plot,
      strength: march.camp.strength - battle.campLost,
      foughtAt: finishedAt,
    },
  ]
}

const laterOf = (left: Instant, right: Instant): Instant =>
  left.epochMilliseconds >= right.epochMilliseconds ? left : right

const applyFinished = (
  fief: Fief,
  finished: FinishedWork,
  stocksAtFinish: Stocks,
): Result<Fief, DomainError> => {
  switch (finished.kind) {
    case 'upgrade':
      return fief.completeUpgrade(finished.slot, stocksAtFinish)
    case 'study':
      return ok(fief.completeStudy(finished.slot, stocksAtFinish))
    case 'recruit':
      return ok(fief.completeRecruitOrder(finished.order, stocksAtFinish))
    case 'battle':
      return ok(fief.completeBattle(finished.march, finished.battle, stocksAtFinish))
    case 'march':
      return ok(fief.completeMarch(finished.march, stocksAtFinish))
    default: {
      const unreachable: never = finished
      return unreachable
    }
  }
}

const completeAt = (
  fief: Fief,
  finished: FinishedWork,
  catalog: BuildingCatalog,
): Result<Fief, DomainError> => {
  const stocksAtFinish = materializeStocks(fief, catalog, finished.finishedAt)
  if (!stocksAtFinish.ok) {
    return stocksAtFinish
  }
  return applyFinished(fief, finished, stocksAtFinish.value)
}

const walkFinishedWork = (
  fief: Fief,
  catalog: BuildingCatalog,
  now: Instant,
  infantryStrength: number,
): Result<WalkedFief, DomainError> => {
  let walked = fief
  const events: Array<FiefEvent> = []
  const campBattles: Array<CampBattle> = []
  for (
    let finished = earliestFinishedOf(walked, now, infantryStrength);
    finished !== undefined;
    finished = earliestFinishedOf(walked, now, infantryStrength)
  ) {
    const completed = completeAt(walked, finished, catalog)
    if (!completed.ok) {
      return completed
    }
    walked = completed.value
    events.push(...eventsOf(finished))
    campBattles.push(...campBattlesOf(finished, walked.coordinates.kingdom))
  }
  const accrued = walked.accruedTo(catalog, laterOf(now, walked.storedAt))
  if (!accrued.ok) {
    return accrued
  }
  return ok({ fief: accrued.value, events, campBattles })
}

const recordCampBattles = async (
  camps: CampRegistry,
  campBattles: ReadonlyArray<CampBattle>,
): Promise<Result<void, DomainError>> => {
  for (const campBattle of campBattles) {
    const recorded = await camps.record(campBattle)
    if (!recorded.ok) {
      return recorded
    }
  }
  return ok(undefined)
}

export const resolveUpgrade = async (
  command: ResolveUpgradeCommand,
  { fiefs, chronicle, camps, catalog, clock }: ResolveUpgradeDependencies,
): Promise<Result<ResolvedFief, DomainError>> => {
  const stored = await fiefs.fiefOf(command.playerId)
  if (!stored.ok) {
    return stored
  }
  const fief = stored.value
  if (fief === undefined) {
    return err({ kind: 'FiefNotFound', playerId: command.playerId })
  }

  const now = clock.now()
  const infantryStrength = catalog.fiefSettings().units.infantry.strength
  if (!fief.isSlotIdleWithQueue && earliestFinishedOf(fief, now, infantryStrength) === undefined) {
    return ok({ fief, events: [], hasChanged: false })
  }

  const resumed = fief.resumeBuildQueue(catalog)
  if (!resumed.ok) {
    return resumed
  }
  const resolved = walkFinishedWork(resumed.value, catalog, now, infantryStrength)
  if (!resolved.ok) {
    return resolved
  }
  const saved = await fiefs.save(resolved.value.fief)
  if (!saved.ok) {
    return saved
  }
  const { fief: resolvedFief, events, campBattles } = resolved.value
  const fought = await recordCampBattles(camps, campBattles)
  if (!fought.ok) {
    return fought
  }
  const recorded = await chronicle.record(resolvedFief.id, events)
  if (!recorded.ok) {
    return recorded
  }
  return ok({ fief: resolvedFief, events, hasChanged: true })
}
