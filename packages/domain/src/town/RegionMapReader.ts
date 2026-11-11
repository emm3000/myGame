import type { PlayerId } from '../player/PlayerId'
import type { SiteAddress } from './SiteAddress'

export type SiteHolder = {
  readonly site: number
  readonly name: string
  readonly playerId: PlayerId
}

export interface RegionMapReader {
  addressOf(playerId: PlayerId): Promise<SiteAddress | undefined>
  lastAreaHoldingTown(region: number): Promise<number>
  townsIn(region: number, area: number): Promise<ReadonlyArray<SiteHolder>>
}
