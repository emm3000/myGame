import type { DueReview, Reviews } from '@mygame/contracts'
import type { DueReviews, PromptedReview } from '@mygame/domain'
import { isoOf } from '#platform/infrastructure/http/isoOf'

const presentDueReview = ({ wordId, lessonId, dueAt, prompt }: PromptedReview): DueReview => {
  const asked = { wordId, lessonId, dueAt: isoOf(dueAt) }
  if (prompt.mode === 'recall') {
    return { ...asked, ...prompt, gappedFrame: [...prompt.gappedFrame] }
  }
  return { ...asked, ...prompt, frame: [...prompt.frame], choices: [...prompt.choices] }
}

export const presentReviews = ({ due, readFirst, nextDueAt, readAt }: DueReviews): Reviews => ({
  due: due.map(presentDueReview),
  readFirst: [...readFirst],
  nextDueAt: nextDueAt === null ? null : isoOf(nextDueAt),
  readAt: isoOf(readAt),
})
