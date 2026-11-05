import {
  namesSeasonsWithArticleFall,
  namesSeasonsWithArticleSpring,
  namesSeasonsWithArticleSummer,
  namesSeasonsWithArticleWinter,
} from '@mygame/catalog'
import type { SeasonKind } from '@mygame/contracts'
import { capitalize } from '../design-system/capitalize'

const seasonsWithArticle: Readonly<Record<SeasonKind, () => string>> = {
  spring: namesSeasonsWithArticleSpring,
  summer: namesSeasonsWithArticleSummer,
  fall: namesSeasonsWithArticleFall,
  winter: namesSeasonsWithArticleWinter,
}

export function capitalizedSeasonWithArticleOf(season: SeasonKind): string {
  return capitalize(seasonsWithArticle[season]())
}
