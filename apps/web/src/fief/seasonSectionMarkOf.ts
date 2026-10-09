import type { FiefOverview, SeasonKind } from '@mygame/contracts'
import type { SeasonMarkProps } from '../design-system/SeasonMark'
import { neutralPercent } from '../seasons/neutralPercent'

type Season = FiefOverview['season']

export type SeasonWork = keyof NonNullable<Season>['durationPercent']

export function seasonSectionMarkOf(
  season: Season,
  work: SeasonWork,
  wordsOf: (season: SeasonKind) => string,
): SeasonMarkProps | undefined {
  if (season === null || season.durationPercent[work] === neutralPercent) {
    return undefined
  }
  return { season: season.kind, words: wordsOf(season.kind) }
}
