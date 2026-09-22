import type { Coordinates } from '../fief/Coordinates'
import type { Fief } from '../fief/Fief'
import type { PlayerId } from '../player/PlayerId'

export interface FiefRepository {
  occupiedCoordinates(): Promise<ReadonlyArray<Coordinates>>
  holdsFief(playerId: PlayerId): Promise<boolean>
  save(fief: Fief): Promise<void>
}
