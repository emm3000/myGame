import type { FiefSettings } from '../ports/BuildingCatalog'
import type { Instant } from '../time/Instant'
import { seasonAt } from './seasonAt'

export const nextSeasonBoundaryAfter = (instant: Instant, settings: FiefSettings): Instant =>
  seasonAt(instant, settings)?.endsAt ?? settings.seasons.epoch
