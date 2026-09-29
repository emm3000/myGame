import type { DomainError } from '../DomainError'
import type { Fief, MarchOrder } from '../fief/Fief'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import type { KingdomMapReader } from '../ports/KingdomMapReader'
import { err, ok, type Result } from '../Result'

export type DispatchMarchCommand = MarchOrder & {
  readonly playerId: PlayerId
}

export type DispatchMarchDependencies = {
  readonly fiefs: FiefRepository
  readonly map: KingdomMapReader
  readonly catalog: BuildingCatalog
  readonly clock: Clock
}

const isWithin = (value: number, last: number): boolean =>
  Number.isInteger(value) && value >= 1 && value <= last

const refuseUnreachableTarget = async (
  fief: Fief,
  order: MarchOrder,
  { map, catalog }: DispatchMarchDependencies,
): Promise<Result<void, DomainError>> => {
  const { province, plot } = order
  const { kingdom } = fief.coordinates
  const lastProvince = (await map.lastOccupiedProvince(kingdom)) + 1
  const { plotsPerProvince } = catalog.fiefSettings()
  if (!isWithin(province, lastProvince) || !isWithin(plot, plotsPerProvince)) {
    return err({ kind: 'MarchTargetOutOfBounds', province, plot })
  }
  if (fief.coordinates.province === province && fief.coordinates.plot === plot) {
    return err({ kind: 'MarchToOwnPlot' })
  }
  const holders = await map.holdersIn(kingdom, province)
  if (holders.some((holder) => holder.plot === plot)) {
    return err({ kind: 'PlotHeld', province, plot })
  }
  return ok(undefined)
}

export const dispatchMarch = async (
  command: DispatchMarchCommand,
  dependencies: DispatchMarchDependencies,
): Promise<Result<Fief, DomainError>> => {
  const { fiefs, catalog, clock } = dependencies
  const stored = await fiefs.fiefOf(command.playerId)
  if (!stored.ok) {
    return stored
  }
  const fief = stored.value
  if (fief === undefined) {
    return err({ kind: 'FiefNotFound', playerId: command.playerId })
  }

  const { forage } = catalog.fiefSettings()
  const room = fief.roomForMarch(command, forage.maxStayHours)
  if (!room.ok) {
    return room
  }
  const reachable = await refuseUnreachableTarget(fief, command, dependencies)
  if (!reachable.ok) {
    return reachable
  }
  const marching = fief.dispatchMarch(command, clock.now(), forage)
  if (!marching.ok) {
    return marching
  }
  const saved = await fiefs.save(marching.value)
  if (!saved.ok) {
    return saved
  }
  return ok(marching.value)
}
