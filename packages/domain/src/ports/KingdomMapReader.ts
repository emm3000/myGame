import type { FiefId } from '../fief/FiefId'
import type { PlotAddress } from '../fief/PlotAddress'
import type { PlayerId } from '../player/PlayerId'

export type PlotHolder = {
  readonly plot: number
  readonly name: string
  readonly playerId: PlayerId
}

export type PlotReservation = {
  readonly plot: number
  readonly playerId: PlayerId
}

export type HeldAddress = {
  readonly address: PlotAddress
  readonly playerId: PlayerId
}

export interface KingdomMapReader {
  addressOf(fiefId: FiefId): Promise<HeldAddress | undefined>
  lastOccupiedProvince(kingdom: number): Promise<number>
  holdersIn(kingdom: number, province: number): Promise<ReadonlyArray<PlotHolder>>
  reservationsIn(kingdom: number, province: number): Promise<ReadonlyArray<PlotReservation>>
}
