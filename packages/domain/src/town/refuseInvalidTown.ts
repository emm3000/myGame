import type { DomainError } from '../DomainError'
import type { Instant } from '../time/Instant'
import type { BuildingLevels } from './building/BuildingLevels'
import type { PaidWork, WorkSlot } from './building/BuildingWork'
import { buildingKinds } from './building/buildingKinds'
import type { WaitingList } from './building/WaitingList'
import type { Hires } from './hiring/Hires'
import type { HiringSlot } from './hiring/HiringOrder'
import { hireKinds } from './hiring/hireKinds'
import type { Job, JobSlot } from './jobs/Job'
import { jobInstantsOf, uncalledJobInstantsOf } from './jobs/jobInstantsOf'
import { refuseInvalidTeam } from './jobs/refuseInvalidTeam'
import { resourceKinds } from './resourceKinds'
import type { Stocks } from './Stocks'
import type { StoredTown } from './Town'

const isWholeFromZero = (value: number): boolean => Number.isInteger(value) && value >= 0

const isWholeFromOne = (value: number): boolean => Number.isInteger(value) && value >= 1

const refuseInvalidStocks = (stocks: Stocks): DomainError | undefined => {
  const invalid = resourceKinds.find((resource) => !isWholeFromZero(stocks[resource]))
  return invalid === undefined
    ? undefined
    : { kind: 'InvalidTownStock', resource: invalid, amount: stocks[invalid] }
}

const refuseInvalidLevels = (levels: BuildingLevels): DomainError | undefined => {
  const invalid = buildingKinds.find((building) => !isWholeFromZero(levels[building]))
  return invalid === undefined
    ? undefined
    : { kind: 'InvalidTownBuildingLevel', building: invalid, level: levels[invalid] }
}

const refuseInvalidCost = (cost: Stocks): DomainError | undefined => {
  const negative = resourceKinds.find((resource) => cost[resource] < 0)
  if (negative !== undefined) {
    return { kind: 'NegativeResourceAmount', amount: cost[negative] }
  }
  const fractional = resourceKinds.find((resource) => !Number.isInteger(cost[resource]))
  return fractional === undefined
    ? undefined
    : { kind: 'FractionalResourceAmount', amount: cost[fractional] }
}

const refuseInvalidWork = (work: PaidWork): DomainError | undefined => {
  if (!Number.isInteger(work.level) || work.level < 1) {
    return { kind: 'InvalidTownBuildingLevel', building: work.building, level: work.level }
  }
  return refuseInvalidCost(work.cost)
}

const refuseInvalidDuration = (seconds: number): DomainError | undefined => {
  if (seconds < 0) {
    return { kind: 'NegativeDuration', seconds }
  }
  return Number.isInteger(seconds) ? undefined : { kind: 'FractionalDuration', seconds }
}

const refuseInvalidSlot = (slot: WorkSlot, storedAt: Instant): DomainError | undefined => {
  if (slot.kind === 'idle') {
    return undefined
  }
  const { startedAt, finishesAt } = slot
  if (startedAt.epochMilliseconds > finishesAt.epochMilliseconds) {
    return { kind: 'SlotStartsAfterFinish', startedAt, finishesAt }
  }
  if (finishesAt.epochMilliseconds < storedAt.epochMilliseconds) {
    return { kind: 'SlotFinishesBeforeStored', storedAt, finishesAt }
  }
  return refuseInvalidWork(slot)
}

const refuseInvalidWaitingList = (waitingList: WaitingList): DomainError | undefined => {
  for (const work of waitingList) {
    const refusal = refuseInvalidWork(work) ?? refuseInvalidDuration(work.durationSeconds)
    if (refusal !== undefined) {
      return refusal
    }
  }
  return undefined
}

const refuseInvalidHires = (hires: Hires): DomainError | undefined => {
  const invalid = hireKinds.find((hire) => !isWholeFromZero(hires[hire]))
  return invalid === undefined
    ? undefined
    : { kind: 'InvalidHireCount', hire: invalid, count: hires[invalid] }
}

const refuseInvalidHiring = (slot: HiringSlot): DomainError | undefined => {
  if (slot.kind === 'idle') {
    return undefined
  }
  const { hire, count, secondsPerHire } = slot
  if (!isWholeFromOne(count)) {
    return { kind: 'InvalidHireCount', hire, count }
  }
  if (!isWholeFromOne(secondsPerHire)) {
    return { kind: 'InvalidHireDuration', hire, secondsPerHire }
  }
  return refuseInvalidCost(slot.costPerHire)
}

const refuseInvalidPayPercent = (payPercent: Job['payPercent']): DomainError | undefined => {
  const invalid = resourceKinds.find((resource) => !isWholeFromOne(payPercent[resource]))
  return invalid === undefined
    ? undefined
    : { kind: 'InvalidPayPercent', resource: invalid, percent: payPercent[invalid] }
}

const refuseCallBackOutsideWork = (job: Job): DomainError | undefined => {
  const { sentAt, calledBackAt } = job
  if (calledBackAt === undefined) {
    return undefined
  }
  if (calledBackAt.epochMilliseconds < sentAt.epochMilliseconds) {
    return { kind: 'SlotStartsAfterFinish', startedAt: sentAt, finishesAt: calledBackAt }
  }
  const { leavesAt } = uncalledJobInstantsOf(job)
  return calledBackAt.epochMilliseconds < leavesAt.epochMilliseconds
    ? undefined
    : { kind: 'SlotStartsAfterFinish', startedAt: calledBackAt, finishesAt: leavesAt }
}

const wasteSizes: ReadonlyArray<number> = [1, 2, 3]

const refuseInvalidCleanUp = (job: Job): DomainError | undefined => {
  const { cleanUp } = job
  if (cleanUp === undefined) {
    return isWholeFromOne(job.hours) ? undefined : { kind: 'InvalidJobHours', hours: job.hours }
  }
  if (job.hours !== 0) {
    return { kind: 'InvalidJobHours', hours: job.hours }
  }
  const { size, waste, strength, hasArrived } = cleanUp
  const isValid =
    wasteSizes.includes(size) &&
    isWholeFromZero(waste) &&
    isWholeFromOne(strength) &&
    !(hasArrived && job.calledBackAt !== undefined)
  return isValid ? undefined : { kind: 'InvalidCleanUp', size, waste, strength }
}

const refuseInvalidJobTerms = (job: Job): DomainError | undefined =>
  refuseInvalidTeam(job.team) ??
  refuseInvalidCleanUp(job) ??
  refuseInvalidDuration(job.oneWaySeconds) ??
  refuseInvalidCost(job.pay) ??
  refuseInvalidPayPercent(job.payPercent) ??
  refuseCallBackOutsideWork(job)

const refuseInvalidJob = (slot: JobSlot, storedAt: Instant): DomainError | undefined => {
  if (slot.kind === 'idle') {
    return undefined
  }
  const refusal = refuseInvalidJobTerms(slot)
  if (refusal !== undefined) {
    return refusal
  }
  const { returnsAt } = jobInstantsOf(slot)
  return returnsAt.epochMilliseconds < storedAt.epochMilliseconds
    ? { kind: 'SlotFinishesBeforeStored', storedAt, finishesAt: returnsAt }
    : undefined
}

export const refuseInvalidTown = (stored: StoredTown): DomainError | undefined =>
  refuseInvalidStocks(stored.stocks) ??
  refuseInvalidLevels(stored.buildingLevels) ??
  refuseInvalidSlot(stored.workSlot, stored.storedAt) ??
  refuseInvalidWaitingList(stored.waitingList) ??
  refuseInvalidHires(stored.hires) ??
  refuseInvalidHiring(stored.hiringSlot) ??
  refuseInvalidJob(stored.jobSlot, stored.storedAt)
