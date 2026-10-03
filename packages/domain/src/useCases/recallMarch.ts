import type { DomainError } from '../DomainError'
import type { Fief } from '../fief/Fief'
import type { FiefOfPlayer } from '../fief/FiefOfPlayer'
import { ownFiefOf } from '../fief/ownFiefOf'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'

export type RecallMarchCommand = FiefOfPlayer & {
  readonly departedAt: Instant
}

export type RecallMarchDependencies = {
  readonly fiefs: FiefRepository
  readonly catalog: BuildingCatalog
  readonly clock: Clock
}

const destinationOf = async (
  recalled: Fief,
  { playerId }: FiefOfPlayer,
  fiefs: FiefRepository,
): Promise<Result<Fief | undefined, DomainError>> => {
  const { march } = recalled
  if (march.kind !== 'away' || march.order !== 'transport') {
    return ok(undefined)
  }
  const stored = await fiefs.fiefOf(march.toFiefId)
  if (!stored.ok) {
    return stored
  }
  return ownFiefOf(stored.value, { playerId, fiefId: march.toFiefId })
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
  const destination = await destinationOf(recalled.value, command, fiefs)
  if (!destination.ok) {
    return destination
  }
  const saved = await fiefs.save(recalled.value)
  if (!saved.ok) {
    return saved
  }
  if (destination.value !== undefined) {
    const savedDestination = await fiefs.save(destination.value.dropCargoFrom(fief.id))
    if (!savedDestination.ok) {
      return savedDestination
    }
  }
  return ok(recalled.value)
}
