import type { DomainError } from '../DomainError'
import type { BusySlot } from '../fief/BuildSlot'
import type { ChangedFief } from '../fief/ChangedFief'
import type { Fief, Stocks } from '../fief/Fief'
import type { FiefEvent } from '../fief/FiefEvent'
import { isSlotFinishedBy } from '../fief/isSlotFinishedBy'
import { materializeStocks } from '../fief/materializeStocks'
import type { BusyStudySlot } from '../fief/StudySlot'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'

export type ResolveUpgradeCommand = {
  readonly playerId: PlayerId
}

export type ResolveUpgradeDependencies = {
  readonly fiefs: FiefRepository
  readonly catalog: BuildingCatalog
  readonly clock: Clock
}

export type ResolvedFief = ChangedFief & {
  readonly hasChanged: boolean
}

type FinishedWork =
  | { readonly kind: 'upgrade'; readonly slot: BusySlot }
  | { readonly kind: 'study'; readonly slot: BusyStudySlot }

const finishedUpgradeOf = (fief: Fief, now: Instant): FinishedWork | undefined => {
  const { slot } = fief
  if (slot.kind === 'idle' || !isSlotFinishedBy(slot, now)) {
    return undefined
  }
  return { kind: 'upgrade', slot }
}

const finishedStudyOf = (fief: Fief, now: Instant): FinishedWork | undefined => {
  const { studySlot } = fief
  if (studySlot.kind === 'idle' || !isSlotFinishedBy(studySlot, now)) {
    return undefined
  }
  return { kind: 'study', slot: studySlot }
}

const earliestFinishedOf = (fief: Fief, now: Instant): FinishedWork | undefined => {
  const upgrade = finishedUpgradeOf(fief, now)
  const study = finishedStudyOf(fief, now)
  if (upgrade === undefined || study === undefined) {
    return upgrade ?? study
  }
  const studyFinishesFirst =
    study.slot.finishesAt.epochMilliseconds < upgrade.slot.finishesAt.epochMilliseconds
  return studyFinishesFirst ? study : upgrade
}

const eventOf = (finished: FinishedWork): FiefEvent => {
  switch (finished.kind) {
    case 'upgrade':
      return {
        kind: 'upgradeFinished',
        building: finished.slot.building,
        level: finished.slot.targetLevel,
        occurredAt: finished.slot.finishesAt,
      }
    case 'study':
      return {
        kind: 'artLearned',
        art: finished.slot.art,
        level: finished.slot.targetLevel,
        occurredAt: finished.slot.finishesAt,
      }
    default: {
      const unreachable: never = finished
      return unreachable
    }
  }
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
  const stocksAtFinish = materializeStocks(fief, catalog, finished.slot.finishesAt)
  if (!stocksAtFinish.ok) {
    return stocksAtFinish
  }
  return applyFinished(fief, finished, stocksAtFinish.value)
}

const walkFinishedWork = (
  fief: Fief,
  catalog: BuildingCatalog,
  now: Instant,
): Result<ChangedFief, DomainError> => {
  let walked = fief
  const events: Array<FiefEvent> = []
  for (
    let finished = earliestFinishedOf(walked, now);
    finished !== undefined;
    finished = earliestFinishedOf(walked, now)
  ) {
    const completed = completeAt(walked, finished, catalog)
    if (!completed.ok) {
      return completed
    }
    walked = completed.value
    events.push(eventOf(finished))
  }
  const accrued = walked.accruedTo(catalog, laterOf(now, walked.storedAt))
  if (!accrued.ok) {
    return accrued
  }
  return ok({ fief: accrued.value, events })
}

export const resolveUpgrade = async (
  command: ResolveUpgradeCommand,
  { fiefs, catalog, clock }: ResolveUpgradeDependencies,
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
  if (!fief.isSlotIdleWithQueue && earliestFinishedOf(fief, now) === undefined) {
    return ok({ fief, events: [], hasChanged: false })
  }

  const resumed = fief.resumeBuildQueue(catalog)
  if (!resumed.ok) {
    return resumed
  }
  const resolved = walkFinishedWork(resumed.value, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const saved = await fiefs.save(resolved.value.fief)
  if (!saved.ok) {
    return saved
  }
  return ok({ ...resolved.value, hasChanged: true })
}
