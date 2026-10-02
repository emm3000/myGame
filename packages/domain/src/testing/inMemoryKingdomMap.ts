import type { FiefId } from '../fief/FiefId'
import type { PlotAddress } from '../fief/PlotAddress'
import type { PlayerId } from '../player/PlayerId'
import type { KingdomMapReader } from '../ports/KingdomMapReader'

export type HeldPlot = {
  readonly fiefId: FiefId
  readonly playerId: PlayerId
  readonly name: string
  readonly address: PlotAddress
}

export type ReservedPlot = {
  readonly playerId: PlayerId
  readonly address: PlotAddress
}

export const inMemoryKingdomMap = (
  heldPlots: ReadonlyArray<HeldPlot>,
  reservedPlots: ReadonlyArray<ReservedPlot> = [],
): KingdomMapReader => ({
  addressOf: async (fiefId) => {
    const held = heldPlots.find((plot) => plot.fiefId === fiefId)
    return held === undefined ? undefined : { address: held.address, playerId: held.playerId }
  },
  lastOccupiedProvince: async (kingdom) =>
    Math.max(
      0,
      ...heldPlots
        .filter((held) => held.address.kingdom === kingdom)
        .map((held) => held.address.province),
    ),
  holdersIn: async (kingdom, province) =>
    heldPlots
      .filter((held) => held.address.kingdom === kingdom && held.address.province === province)
      .map(({ playerId, name, address }) => ({ plot: address.plot, name, playerId })),
  reservationsIn: async (kingdom, province) =>
    reservedPlots
      .filter(
        (reserved) =>
          reserved.address.kingdom === kingdom && reserved.address.province === province,
      )
      .map(({ playerId, address }) => ({ plot: address.plot, playerId })),
})
