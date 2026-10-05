import type { BuildingKind, FiefOverview, ResourceKind, UnitKind } from '@mygame/contracts'
import { secondsBetween } from '../time/secondsBetween'

export type LiveAmounts = Readonly<Record<ResourceKind, number>>

export interface LiveWaitingUpgrade {
  readonly building: BuildingKind
  readonly targetLevel: number
  readonly remainingSeconds: number
}

export interface LiveRecruitOrder {
  readonly unit: UnitKind
  readonly count: number
  readonly delivered: number
  readonly nextUnitRemainingSeconds: number
  readonly remainingSeconds: number
  readonly totalSeconds: number
}

export type MarchPhase = 'outbound' | 'foraging' | 'returning'

export interface LiveMarch {
  readonly phase: MarchPhase
  readonly remainingSeconds: number
  readonly elapsedSeconds: number
  readonly totalSeconds: number
  readonly arrivalSeconds: number
  readonly leavingSeconds: number
}

export interface LiveFief {
  readonly overview: FiefOverview
  readonly amounts: LiveAmounts
  readonly slotRemainingSeconds: number
  readonly slotTotalSeconds: number
  readonly studyRemainingSeconds: number
  readonly studyTotalSeconds: number
  readonly seasonRemainingSeconds: number
  readonly waitingUpgrades: ReadonlyArray<LiveWaitingUpgrade>
  readonly units: Readonly<Record<UnitKind, number>>
  readonly recruitOrder: LiveRecruitOrder | null
  readonly march: LiveMarch | null
  readonly incomingCargoRemainingSeconds: number
}

const secondsPerHour = 3600

const amountAfter = (
  { amount, ratePerHour, capacity }: FiefOverview['resources']['wood'],
  elapsedSeconds: number,
): number =>
  Math.max(amount, Math.min(capacity, amount + (ratePerHour * elapsedSeconds) / secondsPerHour))

const remainingSecondsAt = (
  finishesAt: string,
  overview: FiefOverview,
  elapsedSeconds: number,
): number => {
  const atReadSeconds = (Date.parse(finishesAt) - Date.parse(overview.readAt)) / 1000
  return Math.max(0, atReadSeconds - elapsedSeconds)
}

type TimedWork = FiefOverview['slot'] | FiefOverview['study']

function remainingSecondsOf(
  work: TimedWork,
  overview: FiefOverview,
  elapsedSeconds: number,
): number {
  return work.kind === 'idle' ? 0 : remainingSecondsAt(work.finishesAt, overview, elapsedSeconds)
}

function totalSecondsOf(work: TimedWork): number {
  return work.kind === 'idle'
    ? 0
    : (Date.parse(work.finishesAt) - Date.parse(work.startedAt)) / 1000
}

export function slotRemainingSecondsAt(overview: FiefOverview, elapsedSeconds: number): number {
  return remainingSecondsOf(overview.slot, overview, elapsedSeconds)
}

export function studyRemainingSecondsAt(overview: FiefOverview, elapsedSeconds: number): number {
  return remainingSecondsOf(overview.study, overview, elapsedSeconds)
}

export function seasonRemainingSecondsAt(overview: FiefOverview, elapsedSeconds: number): number {
  return overview.season === null
    ? 0
    : remainingSecondsAt(overview.season.endsAt, overview, elapsedSeconds)
}

export function recruitOrderRemainingSecondsAt(
  overview: FiefOverview,
  elapsedSeconds: number,
): number {
  return overview.recruitOrder === null
    ? 0
    : remainingSecondsAt(overview.recruitOrder.endsAt, overview, elapsedSeconds)
}

function recruitOrderAt(overview: FiefOverview, elapsedSeconds: number): LiveRecruitOrder | null {
  const order = overview.recruitOrder
  if (order === null) {
    return null
  }
  const sinceStartSeconds =
    (Date.parse(overview.readAt) - Date.parse(order.startedAt)) / 1000 + elapsedSeconds
  const delivered = Math.min(
    order.count,
    Math.floor(Math.max(0, sinceStartSeconds) / order.perUnitSeconds),
  )
  return {
    unit: order.unit,
    count: order.count,
    delivered,
    nextUnitRemainingSeconds:
      delivered >= order.count ? 0 : (delivered + 1) * order.perUnitSeconds - sinceStartSeconds,
    remainingSeconds: recruitOrderRemainingSecondsAt(overview, elapsedSeconds),
    totalSeconds: (Date.parse(order.endsAt) - Date.parse(order.startedAt)) / 1000,
  }
}

type AnsweredMarch = NonNullable<FiefOverview['march']>

export const isFoundingOnTheWay = (march: AnsweredMarch): boolean =>
  march.order === 'found' && march.recalledAt === null

const marchEndOf = (march: AnsweredMarch): string =>
  isFoundingOnTheWay(march) ? march.arrivesAt : march.returnsAt

export function marchRemainingSecondsAt(overview: FiefOverview, elapsedSeconds: number): number {
  return overview.march === null
    ? 0
    : remainingSecondsAt(marchEndOf(overview.march), overview, elapsedSeconds)
}

export function battleRemainingSecondsAt(overview: FiefOverview, elapsedSeconds: number): number {
  const march = overview.march
  return march === null || march.order !== 'attack'
    ? 0
    : remainingSecondsAt(march.arrivesAt, overview, elapsedSeconds)
}

export function incomingCargoRemainingSecondsAt(
  overview: FiefOverview,
  elapsedSeconds: number,
): number {
  return overview.incomingCargo === null
    ? 0
    : remainingSecondsAt(overview.incomingCargo.arrivesAt, overview, elapsedSeconds)
}

function phaseOf(march: AnsweredMarch, sinceDeparture: number): MarchPhase {
  if (sinceDeparture < secondsBetween(march.departedAt, march.arrivesAt)) {
    return 'outbound'
  }
  return sinceDeparture < secondsBetween(march.departedAt, march.leavesAt)
    ? 'foraging'
    : 'returning'
}

function marchAt(overview: FiefOverview, elapsedSeconds: number): LiveMarch | null {
  const march = overview.march
  if (march === null) {
    return null
  }
  const sinceDeparture = secondsBetween(march.departedAt, overview.readAt) + elapsedSeconds
  return {
    phase: phaseOf(march, sinceDeparture),
    remainingSeconds: marchRemainingSecondsAt(overview, elapsedSeconds),
    elapsedSeconds: sinceDeparture,
    totalSeconds: secondsBetween(march.departedAt, marchEndOf(march)),
    arrivalSeconds: secondsBetween(march.departedAt, march.arrivesAt),
    leavingSeconds: secondsBetween(march.departedAt, march.leavesAt),
  }
}

function unitsAt(
  overview: FiefOverview,
  order: LiveRecruitOrder | null,
): Readonly<Record<UnitKind, number>> {
  if (order === null || overview.recruitOrder === null) {
    return overview.units
  }
  const deliveredSinceRead = order.delivered - overview.recruitOrder.delivered
  return { ...overview.units, [order.unit]: overview.units[order.unit] + deliveredSinceRead }
}

export function liveFiefAt(overview: FiefOverview, elapsedSeconds: number): LiveFief {
  const { wood, stone, iron, gold, food } = overview.resources
  const recruitOrder = recruitOrderAt(overview, elapsedSeconds)
  return {
    overview,
    amounts: {
      wood: amountAfter(wood, elapsedSeconds),
      stone: amountAfter(stone, elapsedSeconds),
      iron: amountAfter(iron, elapsedSeconds),
      gold: amountAfter(gold, elapsedSeconds),
      food: amountAfter(food, elapsedSeconds),
    },
    slotRemainingSeconds: slotRemainingSecondsAt(overview, elapsedSeconds),
    slotTotalSeconds: totalSecondsOf(overview.slot),
    studyRemainingSeconds: studyRemainingSecondsAt(overview, elapsedSeconds),
    studyTotalSeconds: totalSecondsOf(overview.study),
    seasonRemainingSeconds: seasonRemainingSecondsAt(overview, elapsedSeconds),
    waitingUpgrades: overview.queue.entries.map(({ building, targetLevel, finishesAt }) => ({
      building,
      targetLevel,
      remainingSeconds: remainingSecondsAt(finishesAt, overview, elapsedSeconds),
    })),
    units: unitsAt(overview, recruitOrder),
    recruitOrder,
    march: marchAt(overview, elapsedSeconds),
    incomingCargoRemainingSeconds: incomingCargoRemainingSecondsAt(overview, elapsedSeconds),
  }
}
