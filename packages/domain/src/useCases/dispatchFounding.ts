import { campOf } from '../camp/campOf'
import type { DomainError } from '../DomainError'
import type { Fief } from '../fief/Fief'
import { FiefName } from '../fief/FiefName'
import type { FiefOfPlayer } from '../fief/FiefOfPlayer'
import { ownFiefOf } from '../fief/ownFiefOf'
import { refuseUnreachableTarget } from '../march/refuseUnreachableTarget'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import type { KingdomMapReader } from '../ports/KingdomMapReader'
import { err, ok, type Result } from '../Result'
import { marchSeasonAt } from '../season/marchSeasonAt'

export type DispatchFoundingCommand = FiefOfPlayer & {
  readonly province: number
  readonly plot: number
  readonly name: string
}

export type DispatchFoundingDependencies = {
  readonly fiefs: FiefRepository
  readonly map: KingdomMapReader
  readonly catalog: BuildingCatalog
  readonly clock: Clock
}

const refuseFiefCap = async (
  playerId: PlayerId,
  fiefs: FiefRepository,
  fiefCap: number,
): Promise<Result<void, DomainError>> => {
  const held = await fiefs.fiefsOf(playerId)
  const onTheRoad = await fiefs.foundingsOnTheRoadOf(playerId)
  return held.length + onTheRoad >= fiefCap
    ? err({ kind: 'FiefCapReached', cap: fiefCap })
    : ok(undefined)
}

export const dispatchFounding = async (
  command: DispatchFoundingCommand,
  { fiefs, map, catalog, clock }: DispatchFoundingDependencies,
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
  const name = FiefName.create(command.name)
  if (!name.ok) {
    return name
  }
  const room = fief.roomForFounding()
  if (!room.ok) {
    return room
  }
  const settings = catalog.fiefSettings()
  const capped = await refuseFiefCap(command.playerId, fiefs, settings.fiefCap)
  if (!capped.ok) {
    return capped
  }
  const reachable = await refuseUnreachableTarget(fief, command, map, settings.plotsPerProvince)
  if (!reachable.ok) {
    return reachable
  }
  const { province, plot } = command
  if (campOf({ kingdom: fief.coordinates.kingdom, province, plot }, settings.camps) !== undefined) {
    return err({ kind: 'PlotHasCamp', province, plot })
  }
  const now = clock.now()
  const founding = fief.dispatchFounding(
    { province, plot, name: name.value },
    now,
    settings,
    marchSeasonAt(now, settings),
  )
  if (!founding.ok) {
    return founding
  }
  const saved = await fiefs.save(founding.value)
  if (!saved.ok) {
    return saved
  }
  return ok(founding.value)
}
