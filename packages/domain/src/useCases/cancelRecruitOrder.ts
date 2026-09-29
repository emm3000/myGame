import type { DomainError } from '../DomainError'
import type { ChangedFief } from '../fief/ChangedFief'
import { materializeStocks } from '../fief/materializeStocks'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingCatalog, UnitKind } from '../ports/BuildingCatalog'
import type { ChronicleWriter } from '../ports/ChronicleWriter'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'

export type CancelRecruitOrderCommand = {
  readonly playerId: PlayerId
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
  const stored = await fiefs.fiefOf(command.playerId)
  if (!stored.ok) {
    return stored
  }
  const fief = stored.value
  if (fief === undefined) {
    return err({ kind: 'FiefNotFound', playerId: command.playerId })
  }

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
  const saved = await fiefs.save(cancelled.value.fief)
  if (!saved.ok) {
    return saved
  }
  const recorded = await chronicle.record(cancelled.value.fief.id, cancelled.value.events)
  if (!recorded.ok) {
    return recorded
  }
  return ok(cancelled.value)
}
