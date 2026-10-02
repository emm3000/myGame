import type { DomainError } from '../DomainError'
import type { ChangedFief } from '../fief/ChangedFief'
import type { FiefOfPlayer } from '../fief/FiefOfPlayer'
import { materializeStocks } from '../fief/materializeStocks'
import { ownFiefOf } from '../fief/ownFiefOf'
import type { ArtKind, BuildingCatalog } from '../ports/BuildingCatalog'
import type { ChronicleWriter } from '../ports/ChronicleWriter'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { ok, type Result } from '../Result'

export type CancelStudyCommand = FiefOfPlayer & {
  readonly art: ArtKind
  readonly targetLevel: number
}

export type CancelStudyDependencies = {
  readonly fiefs: FiefRepository
  readonly chronicle: ChronicleWriter
  readonly catalog: BuildingCatalog
  readonly clock: Clock
}

export const cancelStudy = async (
  command: CancelStudyCommand,
  { fiefs, chronicle, catalog, clock }: CancelStudyDependencies,
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
  const cancelled = fief.cancelStudy(
    { art: command.art, targetLevel: command.targetLevel },
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
