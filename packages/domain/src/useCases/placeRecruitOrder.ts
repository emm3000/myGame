import type { DomainError } from '../DomainError'
import { derivePeasantCounts } from '../fief/derivePeasantCounts'
import { deriveProjectedFreePeasants } from '../fief/deriveProjectedFreePeasants'
import type { Fief } from '../fief/Fief'
import { materializeStocks } from '../fief/materializeStocks'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingCatalog, UnitKind } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import type { FiefRepository } from '../ports/FiefRepository'
import { err, ok, type Result } from '../Result'
import { durationPercentAt } from '../season/durationPercentAt'

export type PlaceRecruitOrderCommand = {
  readonly playerId: PlayerId
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
  const built = derivePeasantCounts(fief.buildingLevels, fief.units, fief.recruitOrder, catalog)
  if (!built.ok) {
    return built
  }
  const projectedFree = deriveProjectedFreePeasants(fief, catalog)
  if (!projectedFree.ok) {
    return projectedFree
  }
  const freePeasants = Math.min(built.value.free, projectedFree.value)
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
