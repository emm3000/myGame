import type { DomainError } from '../DomainError'
import type { ChangedFief } from '../fief/ChangedFief'
import type { FiefOfPlayer } from '../fief/FiefOfPlayer'
import { materializeStocks } from '../fief/materializeStocks'
import { ownFiefOf } from '../fief/ownFiefOf'
import { rebaseFullSince } from '../fief/rebaseFullSince'
import type { BuildingCatalog, UnitKind } from '../ports/BuildingCatalog'
import type { ChronicleWriter } from '../ports/ChronicleWriter'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'

export type CancelRecruitOrderCommand = FiefOfPlayer & {
  readonly unit: UnitKind
  readonly startedAt: Instant
}

export type CancelRecruitOrderDependencies = {
  readonly fiefs: FiefRepository
  readonly chronicle: ChronicleWriter
  readonly catalog: BuildingCatalog
  readonly clock: Clock
}

export const cancelRecruitOrder = async (
  command: CancelRecruitOrderCommand,
  { fiefs, chronicle, catalog, clock }: CancelRecruitOrderDependencies,
): Promise<Result<ChangedFief, DomainError>> => {
  const stored = await fiefs.fiefOf(command.fiefId)
  if (!stored.ok) {
    return stored
  }
  const owned = ownFiefOf(stored.value, command)
  if (!owned.ok) {
    return owned
  }
  const fief = owned.value

  const now = clock.now()
  const stocksAtNow = materializeStocks(fief, catalog, now)
  if (!stocksAtNow.ok) {
    return stocksAtNow
  }
  const cancelled = fief.cancelRecruitOrder(
    { unit: command.unit, startedAt: command.startedAt },
    stocksAtNow.value,
    now,
  )
  if (!cancelled.ok) {
    return cancelled
  }
  const rebased = rebaseFullSince(fief, cancelled.value.fief, catalog)
  if (!rebased.ok) {
    return rebased
  }
  const saved = await fiefs.save(rebased.value)
  if (!saved.ok) {
    return saved
  }
  const recorded = await chronicle.record(rebased.value.id, cancelled.value.events)
  if (!recorded.ok) {
    return recorded
  }
  return ok({ fief: rebased.value, events: cancelled.value.events })
}
