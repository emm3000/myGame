import type { PlayerId } from '../player/PlayerId'
import type { FiefId } from './FiefId'

export type FiefOfPlayer = {
  readonly playerId: PlayerId
  readonly fiefId: FiefId
}
