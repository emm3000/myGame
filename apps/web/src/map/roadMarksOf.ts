import { marchRoadSeasonMark } from '@mygame/catalog'
import type { FiefOverview } from '@mygame/contracts'
import type { SeasonMarkProps } from '../design-system/SeasonMark'
import { seasonSectionMarkOf } from '../fief/seasonSectionMarkOf'
import { capitalizedSeasonWithArticleOf } from '../seasons/capitalizedSeasonWithArticleOf'

export function roadMarksOf(fief: FiefOverview): ReadonlyArray<SeasonMarkProps> {
  const mark = seasonSectionMarkOf(fief.season, 'road', (season) =>
    marchRoadSeasonMark({ season: capitalizedSeasonWithArticleOf(season) }),
  )
  return mark === undefined ? [] : [mark]
}
