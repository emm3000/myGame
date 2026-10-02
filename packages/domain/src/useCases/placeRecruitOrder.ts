import type { DomainError } from '../DomainError'
import { deriveLowestFreePeasants } from '../fief/deriveLowestFreePeasants'
import type { Fief } from '../fief/Fief'
import type { FiefId } from '../fief/FiefId'
import { materializeStocks } from '../fief/materializeStocks'
import { ownFiefOf } from '../fief/ownFiefOf'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingCatalog, UnitKind } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { err, ok, type Result } from '../Result'
import { durationPercentAt } from '../season/durationPercentAt'

export type PlaceRecruitOrderCommand = {
  readonly playerId: PlayerId
  readonly fiefId: FiefId
  readonly unit: UnitKind
  readonly count: number
}

export type PlaceRecruitOrderDependencies = {
  readonly fiefs: FiefRepository
  readonly catalog: BuildingCatalog
  readonly clock: Clock
}

const staffOrder = (
  fief: Fief,
  command: PlaceRecruitOrderCommand,
  catalog: BuildingCatalog,
): Result<void, DomainError> => {
  const lowestFree = deriveLowestFreePeasants(fief, catalog)
  if (!lowestFree.ok) {
    return lowestFree
  }
  const freePeasants = lowestFree.value
  const requiredPeasants =
    command.count * catalog.fiefSettings().units[command.unit].peasantOccupancy
  if (requiredPeasants > freePeasants) {
    return err({ kind: 'NotEnoughPeasants', requiredPeasants, freePeasants })
  }
  return ok(undefined)
}

export const placeRecruitOrder = async (
  command: PlaceRecruitOrderCommand,
  { fiefs, catalog, clock }: PlaceRecruitOrderDependencies,
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

  const now = clock.now()
  const stocksAtNow = materializeStocks(fief, catalog, now)
  if (!stocksAtNow.ok) {
    return stocksAtNow
  }
  const { unit, count } = command
  const recruiting = fief.placeRecruitOrder(
    { unit, count, terms: catalog.fiefSettings().units[unit] },
    stocksAtNow.value,
    now,
    durationPercentAt(now, catalog.fiefSettings()).train,
  )
  if (!recruiting.ok) {
    return recruiting
  }
  const staffed = staffOrder(fief, command, catalog)
  if (!staffed.ok) {
    return staffed
  }
  const saved = await fiefs.save(recruiting.value)
  if (!saved.ok) {
    return saved
  }
  return ok(recruiting.value)
}
