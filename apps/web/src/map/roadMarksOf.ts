import type { FiefOverview } from '@mygame/contracts'
import { copy } from '../copy'
import type { SeasonMarkProps } from '../design-system/SeasonMark'
import { seasonSectionMarkOf } from '../fief/seasonSectionMarkOf'

export function roadMarksOf(fief: FiefOverview): ReadonlyArray<SeasonMarkProps> {
  const mark = seasonSectionMarkOf(fief.season, 'road', copy.march.roadSeasonMark)
  return mark === undefined ? [] : [mark]
}
