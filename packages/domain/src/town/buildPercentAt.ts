import type { Instant } from '../time/Instant'
import { seasonPercentsAt } from './seasonPercentsAt'
import type { TownSettings } from './TownSettings'

export const buildPercentAt = (instant: Instant, settings: TownSettings): number =>
  seasonPercentsAt(instant, settings).durationPercent.build
