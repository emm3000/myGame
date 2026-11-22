import type { PlayerId } from '#player/PlayerId'
import type { Hires } from '../../hiring/Hires'

export type JobTarget = {
  readonly area: number
  readonly site: number
}

export type JobOrder = {
  readonly playerId: PlayerId
  readonly site: JobTarget
  readonly team: Hires
  readonly hours: number
}
