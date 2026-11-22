import type { Terrain } from '../../domain/Terrain'
import type { ResourceKind } from '../../resources/domain/ResourceKind'

export type JobPayPerHour = Readonly<Record<ResourceKind, number>>

export type JobTerms = {
  readonly secondsPerArea: number
  readonly secondsPerSite: number
  readonly maxHours: number
  readonly payPerHour: Readonly<Record<Terrain, JobPayPerHour>>
}
