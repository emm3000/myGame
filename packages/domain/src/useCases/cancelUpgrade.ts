import type { DomainError } from '../DomainError'
import type { ChangedFief } from '../fief/ChangedFief'
import { materializeStocks } from '../fief/materializeStocks'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingCatalog, BuildingKind } from '../ports/BuildingCatalog'
import type { ChronicleWriter } from '../ports/ChronicleWriter'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { err, ok, type Result } from '../Result'

export type CancelUpgradeCommand = {
  readonly playerId: PlayerId
  readonly building: BuildingKind
  readonly targetLevel: number
}

export type CancelUpgradeDependencies = {
  readonly fiefs: FiefRepository
  readonly chronicle: ChronicleWriter
  readonly catalog: BuildingCatalog
  readonly clock: Clock
}

export const cancelUpgrade = async (
  command: CancelUpgradeCommand,
  { fiefs, chronicle, catalog, clock }: CancelUpgradeDependencies,
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
  const cancelled = fief.cancelUpgrade(
    { building: command.building, targetLevel: command.targetLevel },
    stocksAtNow.value,
    now,
    catalog,
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
