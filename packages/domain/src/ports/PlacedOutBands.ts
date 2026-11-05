import type { DomainError } from '../DomainError'
import type { Band } from '../learning/BandStart'
import type { PlayerId } from '../player/PlayerId'
import type { Result } from '../Result'

export interface PlacedOutBands {
  placedOutBandsOf(playerId: PlayerId): Promise<Result<ReadonlyArray<Band>, DomainError>>
}
