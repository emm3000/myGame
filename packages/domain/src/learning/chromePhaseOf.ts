import type { TownSkill } from '../town/TownSkill'
import type { HeldCard } from './HeldCard'
import { holdsLessonCards } from './holdsLessonCards'
import type { Lesson } from './Lesson'
import type { Scaffold } from './Scaffold'

export type ChromePhase = 'scaffold' | 'both' | 'english'

export const chromePhaseOf = (
  scaffold: Scaffold,
  chromeLessons: ReadonlyArray<Pick<Lesson, 'id' | 'words'>>,
  cards: ReadonlyArray<Pick<HeldCard, 'wordId'>>,
  earnedSkills: ReadonlyArray<Pick<TownSkill, 'lessonId'>>,
): ChromePhase => {
  if (scaffold === 'none') {
    return 'english'
  }
  if (!chromeLessons.every((lesson) => holdsLessonCards(lesson, cards))) {
    return 'scaffold'
  }
  const isEveryChromeSkillEarned = chromeLessons.every(({ id }) =>
    earnedSkills.some(({ lessonId }) => lessonId === id),
  )
  return isEveryChromeSkillEarned ? 'english' : 'both'
}
