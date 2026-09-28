import type { DomainError } from '../DomainError'
import { terrainOf } from '../fief/terrainOf'
import type { ProvinceMap, ProvincePlot } from '../kingdom/ProvinceMap'
import type { PlayerId } from '../player/PlayerId'
import type { BuildingCatalog } from '../ports/BuildingCatalog'
import type { KingdomMapReader, PlotHolder } from '../ports/KingdomMapReader'
import { err, ok, type Result } from '../Result'

export type ReadProvinceMapCommand = {
  readonly playerId: PlayerId
  readonly province?: number
}

export type ReadProvinceMapDependencies = {
  readonly map: KingdomMapReader
  readonly catalog: BuildingCatalog
}

const plotsOf = (
  plotsPerProvince: number,
  holders: ReadonlyArray<PlotHolder>,
  viewer: PlayerId,
): ReadonlyArray<ProvincePlot> =>
  Array.from({ length: plotsPerProvince }, (_, index) => {
    const plot = index + 1
    const holder = holders.find((held) => held.plot === plot)
    return {
      plot,
      fief:
        holder === undefined ? undefined : { name: holder.name, isOwn: holder.playerId === viewer },
    }
  })

export const readProvinceMap = async (
  command: ReadProvinceMapCommand,
  { map, catalog }: ReadProvinceMapDependencies,
): Promise<Result<ProvinceMap, DomainError>> => {
  const address = await map.addressOf(command.playerId)
  if (address === undefined) {
    return err({ kind: 'FiefNotFound', playerId: command.playerId })
  }
  const province = command.province ?? address.province
  const lastProvince = (await map.lastOccupiedProvince(address.kingdom)) + 1
  if (!Number.isInteger(province) || province < 1 || province > lastProvince) {
    return err({ kind: 'ProvinceNotFound', province, lastProvince })
  }
  const holders = await map.holdersIn(address.kingdom, province)
  return ok({
    kingdom: address.kingdom,
    province,
    lastProvince,
    terrain: terrainOf(province),
    plots: plotsOf(catalog.fiefSettings().plotsPerProvince, holders, command.playerId),
  })
}
