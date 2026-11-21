import type { ResourceKind } from '../resources/ResourceKind'
import type { Terrain } from './Terrain'

export type JobPayPerHour = Readonly<Record<ResourceKind, number>>

export type JobTerms = {
  readonly secondsPerArea: number
  readonly secondsPerSite: number
  readonly maxHours: number
  readonly payPerHour: Readonly<Record<Terrain, JobPayPerHour>>
}
