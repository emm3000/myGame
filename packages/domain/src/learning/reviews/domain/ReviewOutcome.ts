import type { Town } from '#town/domain/Town'
import type { TownSkill } from '#town/domain/TownSkill'
import type { LessonWord } from '../../domain/Lesson'
import type { Scaffold } from '../../scaffold/domain/Scaffold'
import type { AnsweredReview } from './AnsweredReview'

export type ReviewOutcome = {
  readonly answered: AnsweredReview
  readonly word: LessonWord
  readonly scaffold: Scaffold
  readonly skills: ReadonlyArray<TownSkill>
  readonly town: Town | undefined
  readonly skillWords: ReadonlyArray<string>
}
