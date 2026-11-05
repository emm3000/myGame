import type { Instant } from '../time/Instant'
import type { SeasonedSettings } from './SeasonedSettings'
import { seasonAt } from './seasonAt'

export const nextSeasonBoundaryAfter = (instant: Instant, settings: SeasonedSettings): Instant =>
  seasonAt(instant, settings)?.endsAt ?? settings.seasons.epoch
