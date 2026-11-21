import type { Report } from '@mygame/contracts'
import { presentReviews } from '../../../learning/application/serveDueReviews'
import { townNewsItemOf } from '../../../town/townNewsItemOf'
import type { ServedReport } from '../../application/serveReport'

export const presentReport = ({ reviews, news }: ServedReport): Report => {
  const { due, readFirst, nextDueAt, readAt } = presentReviews(reviews)
  return {
    dueCount: due.length,
    due,
    readFirst,
    nextDueAt,
    readAt,
    news: news.map(townNewsItemOf),
  }
}
