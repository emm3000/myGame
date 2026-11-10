import type { TownSkill } from '../town/TownSkill'
import type { HeldCard } from './HeldCard'
import { heldCardsOf } from './heldCardsOf'
import { isWordRetained } from './isWordRetained'
import type { Lesson } from './Lesson'

export type RetainedWords = {
  readonly count: number
  readonly total: number
}

export const retainedWordsOf = (
  lessons: ReadonlyArray<Lesson>,
  skills: ReadonlyArray<Pick<TownSkill, 'lessonId'>>,
  cards: ReadonlyArray<HeldCard>,
): RetainedWords | null => {
  const lesson = lessons.find(({ id }) => !skills.some(({ lessonId }) => lessonId === id))
  if (lesson === undefined) {
    return null
  }
  const held = heldCardsOf(lesson, cards)
  if (held.length === 0) {
    return null
  }
  return { count: held.filter(isWordRetained).length, total: held.length }
}
