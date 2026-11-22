import type { Instant } from '#time/Instant'
import { seasonPercentsAt } from '../domain/seasonPercentsAt'
import type { TownSettings } from '../domain/TownSettings'

export const hirePercentAt = (instant: Instant, settings: TownSettings): number =>
  seasonPercentsAt(instant, settings).durationPercent.hire
