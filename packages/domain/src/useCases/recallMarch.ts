import type { DomainError } from '../DomainError'
import type { Fief } from '../fief/Fief'
import type { FiefId } from '../fief/FiefId'
import { ownFiefOf } from '../fief/ownFiefOf'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'

export type RecallMarchCommand = {
  readonly playerId: PlayerId
  readonly fiefId: FiefId
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
  const stored = await fiefs.fiefOf(command.fiefId)
  if (!stored.ok) {
    return stored
  }
  const owned = ownFiefOf(stored.value, command)
  if (!owned.ok) {
    return owned
  }
  const fief = owned.value

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
