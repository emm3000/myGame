import type { DomainError } from '../DomainError'
import type { BusySlot } from '../fief/BuildSlot'
import type { Fief } from '../fief/Fief'
import { materializeStocks } from '../fief/materializeStocks'
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

export type ResolvedFief = {
  readonly fief: Fief
  readonly hasChanged: boolean
}

const finishedUpgradeOf = (fief: Fief, now: Instant): BusySlot | undefined => {
  const { slot } = fief
  if (slot.kind === 'idle') {
    return undefined
  }
  return slot.finishesAt.epochMilliseconds <= now.epochMilliseconds ? slot : undefined
}

const completeAt = (
  fief: Fief,
  finished: BusySlot,
  catalog: BuildingCatalog,
): Result<Fief, DomainError> => {
  const stocksAtFinish = materializeStocks(fief, catalog, finished.finishesAt)
  if (!stocksAtFinish.ok) {
    return stocksAtFinish
  }
  return fief.completeUpgrade(finished, stocksAtFinish.value)
}

const walkFinishedUpgrades = (
  fief: Fief,
  catalog: BuildingCatalog,
  now: Instant,
): Result<Fief, DomainError> => {
  let walked = fief
  for (
    let finished = finishedUpgradeOf(walked, now);
    finished !== undefined;
    finished = finishedUpgradeOf(walked, now)
  ) {
    const completed = completeAt(walked, finished, catalog)
    if (!completed.ok) {
      return completed
    }
    walked = completed.value
  }
  return walked.accruedTo(catalog, now)
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
  if (!fief.isQueueStalled && finishedUpgradeOf(fief, now) === undefined) {
    return ok({ fief, hasChanged: false })
  }

  const resumed = fief.resumeBuildQueue()
  if (!resumed.ok) {
    return resumed
  }
  const resolved = walkFinishedUpgrades(resumed.value, catalog, now)
  if (!resolved.ok) {
    return resolved
  }
  const saved = await fiefs.save(resolved.value)
  if (!saved.ok) {
    return saved
  }
  return ok({ fief: resolved.value, hasChanged: true })
}
