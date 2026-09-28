import type { PlotAddress } from '../fief/PlotAddress'
import type { PlayerId } from '../player/PlayerId'

export type PlotHolder = {
  readonly plot: number
  readonly name: string
  readonly playerId: PlayerId
}

export interface KingdomMapReader {
  addressOf(playerId: PlayerId): Promise<PlotAddress | undefined>
  lastOccupiedProvince(kingdom: number): Promise<number>
  holdersIn(kingdom: number, province: number): Promise<ReadonlyArray<PlotHolder>>
}
