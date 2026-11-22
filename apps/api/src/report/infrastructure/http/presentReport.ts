import type { Report } from '@mygame/contracts'
import type { ServedReport } from '@mygame/domain'
import { presentReviews } from '#learning/infrastructure/http/presentReviews'
import { presentTownNewsItem } from '#town/news/infrastructure/http/presentTownNewsItem'

export const presentReport = ({ reviews, news }: ServedReport): Report => {
  const { due, readFirst, nextDueAt, readAt } = presentReviews(reviews)
  return {
    dueCount: due.length,
    due,
    readFirst,
    nextDueAt,
    readAt,
    news: news.map(presentTownNewsItem),
  }
}
