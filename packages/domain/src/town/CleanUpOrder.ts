import type { PlayerId } from '../player/PlayerId'
import type { Hires } from './Hires'
import type { JobTarget } from './JobOrder'

export type CleanUpOrder = {
  readonly playerId: PlayerId
  readonly site: JobTarget
  readonly team: Hires
}
