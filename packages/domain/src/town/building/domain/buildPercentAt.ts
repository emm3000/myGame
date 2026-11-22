import type { Instant } from '#time/Instant'
import { seasonPercentsAt } from '../../domain/seasonPercentsAt'
import type { TownSettings } from '../../domain/TownSettings'

export const buildPercentAt = (instant: Instant, settings: TownSettings): number =>
  seasonPercentsAt(instant, settings).durationPercent.build
