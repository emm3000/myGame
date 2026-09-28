import type { PlotAddress } from '../fief/PlotAddress'
import type { PlayerId } from '../player/PlayerId'
import type { KingdomMapReader } from '../ports/KingdomMapReader'

export type HeldPlot = {
  readonly playerId: PlayerId
  readonly name: string
  readonly address: PlotAddress
}

export const inMemoryKingdomMap = (heldPlots: ReadonlyArray<HeldPlot>): KingdomMapReader => ({
  addressOf: async (playerId) => heldPlots.find((held) => held.playerId === playerId)?.address,
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
})
