import type { CampBattle } from '../camp/CampBattle'
import { campOf } from '../camp/campOf'
import { campStrengthAt } from '../camp/campStrengthAt'
import type { DomainError } from '../DomainError'
import type { FiefOfPlayer } from '../fief/FiefOfPlayer'
import { terrainOf } from '../fief/terrainOf'
import type { ProvinceMap, ProvincePlot } from '../kingdom/ProvinceMap'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingCatalog, CampTerms } from '../ports/BuildingCatalog'
import type { CampRegistry } from '../ports/CampRegistry'
import type { Clock } from '../ports/Clock'
import type { KingdomMapReader, PlotHolder, PlotReservation } from '../ports/KingdomMapReader'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'

export type ReadProvinceMapCommand = FiefOfPlayer & {
  readonly province?: number
}

export type ReadProvinceMapDependencies = {
  readonly map: KingdomMapReader
  readonly catalog: BuildingCatalog
  readonly camps: Pick<CampRegistry, 'lastBattlesIn'>
  readonly clock: Clock
}

type ProvinceCamps = {
  readonly kingdom: number
  readonly province: number
  readonly terms: CampTerms
  readonly lastBattles: ReadonlyArray<CampBattle>
  readonly now: Instant
}

const campOnFreePlot = (plot: number, camps: ProvinceCamps): ProvincePlot['camp'] => {
  const camp = campOf({ kingdom: camps.kingdom, province: camps.province, plot }, camps.terms)
  if (camp === undefined) {
    return undefined
  }
  const lastBattle = camps.lastBattles.find((battle) => battle.plot === plot)
  return {
    tier: camp.tier,
    strength: campStrengthAt(camps.terms.tiers[camp.tier], lastBattle, camps.now),
  }
}

type ProvinceOccupants = {
  readonly holders: ReadonlyArray<PlotHolder>
  readonly reservations: ReadonlyArray<PlotReservation>
  readonly viewer: PlayerId
}

const plotOf = (
  plot: number,
  { holders, reservations, viewer }: ProvinceOccupants,
  camps: ProvinceCamps,
): ProvincePlot => {
  const holder = holders.find((held) => held.plot === plot)
  if (holder !== undefined) {
    const fief = { name: holder.name, isOwn: holder.playerId === viewer }
    return { plot, fief, camp: undefined, reservation: undefined }
  }
  const reserved = reservations.find((reservation) => reservation.plot === plot)
  if (reserved !== undefined) {
    const reservation = { isOwn: reserved.playerId === viewer }
    return { plot, fief: undefined, camp: undefined, reservation }
  }
  return { plot, fief: undefined, camp: campOnFreePlot(plot, camps), reservation: undefined }
}

export const readProvinceMap = async (
  command: ReadProvinceMapCommand,
  { map, catalog, camps, clock }: ReadProvinceMapDependencies,
): Promise<Result<ProvinceMap, DomainError>> => {
  const held = await map.addressOf(command.fiefId)
  if (held === undefined || held.playerId !== command.playerId) {
    return err({ kind: 'FiefNotFound', fiefId: command.fiefId })
  }
  const { address } = held
  const province = command.province ?? address.province
  const lastProvince = (await map.lastOccupiedProvince(address.kingdom)) + 1
  if (!Number.isInteger(province) || province < 1 || province > lastProvince) {
    return err({ kind: 'ProvinceNotFound', province, lastProvince })
  }
  const occupants = {
    holders: await map.holdersIn(address.kingdom, province),
    reservations: await map.reservationsIn(address.kingdom, province),
    viewer: command.playerId,
  }
  const settings = catalog.fiefSettings()
  const provinceCamps = {
    kingdom: address.kingdom,
    province,
    terms: settings.camps,
    lastBattles: await camps.lastBattlesIn(address.kingdom, province),
    now: clock.now(),
  }
  return ok({
    kingdom: address.kingdom,
    province,
    lastProvince,
    terrain: terrainOf(province),
    plots: Array.from({ length: settings.plotsPerProvince }, (_, index) =>
      plotOf(index + 1, occupants, provinceCamps),
    ),
  })
}
