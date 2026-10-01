import type { DomainError } from '../DomainError'
import type { Fief } from '../fief/Fief'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'

export type RecallMarchCommand = {
  readonly playerId: PlayerId
  readonly departedAt: Instant
}

export type RecallMarchDependencies = {
  readonly fiefs: FiefRepository
  readonly catalog: BuildingCatalog
  readonly clock: Clock
}

export const recallMarch = async (
  command: RecallMarchCommand,
  { fiefs, catalog, clock }: RecallMarchDependencies,
): Promise<Result<Fief, DomainError>> => {
  const stored = await fiefs.fiefOf(command.playerId)
  if (!stored.ok) {
    return stored
  }
  const fief = stored.value
  if (fief === undefined) {
    return err({ kind: 'FiefNotFound', playerId: command.playerId })
  }

  const recalled = fief.recallMarch(
    { departedAt: command.departedAt },
    clock.now(),
    catalog.fiefSettings(),
  )
  if (!recalled.ok) {
    return recalled
  }
  const saved = await fiefs.save(recalled.value)
  if (!saved.ok) {
    return saved
  }
  return ok(recalled.value)
}
