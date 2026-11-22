import type { Instant } from '#time/Instant'
import type { TownSettings } from '../../domain/TownSettings'
import type { BuildingLevel } from './BuildingLevel'
import { buildPercentAt } from './buildPercentAt'
import type { WaitingWork } from './WaitingList'

export const levelWorkAt = (
  next: BuildingLevel,
  at: Instant,
  settings: TownSettings,
): WaitingWork => ({
  building: next.building,
  level: next.level,
  cost: next.cost,
  durationSeconds: Math.ceil((next.durationSeconds * buildPercentAt(at, settings)) / 100),
})
