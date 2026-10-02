import { campOf } from '../camp/campOf'
import type { DomainError } from '../DomainError'
import type { Fief, MarchOrder } from '../fief/Fief'
import type { FiefOfPlayer } from '../fief/FiefOfPlayer'
import { ownFiefOf } from '../fief/ownFiefOf'
import { refuseUnreachableTarget } from '../march/refuseUnreachableTarget'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import type { KingdomMapReader } from '../ports/KingdomMapReader'
import { err, ok, type Result } from '../Result'
import { marchSeasonAt } from '../season/marchSeasonAt'

export type DispatchMarchCommand = MarchOrder & FiefOfPlayer

export type DispatchMarchDependencies = {
  readonly fiefs: FiefRepository
  readonly map: KingdomMapReader
  readonly catalog: BuildingCatalog
  readonly clock: Clock
}

export const dispatchMarch = async (
  command: DispatchMarchCommand,
  { fiefs, map, catalog, clock }: DispatchMarchDependencies,
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
  const settings = catalog.fiefSettings()
  const { forage, units, camps, plotsPerProvince } = settings
  const room = fief.roomForMarch(command, forage.maxStayHours)
  if (!room.ok) {
    return room
  }
  const reachable = await refuseUnreachableTarget(fief, command, map, plotsPerProvince)
  if (!reachable.ok) {
    return reachable
  }
  const { province, plot } = command
  if (campOf({ kingdom: fief.coordinates.kingdom, province, plot }, camps) !== undefined) {
    return err({ kind: 'PlotHasCamp', province, plot })
  }
  const now = clock.now()
  const marching = fief.dispatchMarch(command, now, { forage, units }, marchSeasonAt(now, settings))
  if (!marching.ok) {
    return marching
  }
  const saved = await fiefs.save(marching.value)
  if (!saved.ok) {
    return saved
  }
  return ok(marching.value)
}
