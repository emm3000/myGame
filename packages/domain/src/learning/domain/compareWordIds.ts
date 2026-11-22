import type { WordId } from './Lesson'

export const compareWordIds = (left: WordId, right: WordId): number => {
  if (left === right) {
    return 0
  }
  return left < right ? -1 : 1
}
