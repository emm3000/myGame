import type { LessonWord } from '../Lesson'
import { anchorFrameOf } from './anchorFrameOf'
import type { FrameLearner } from './FrameLearner'
import type { FrameSpans } from './FrameSpan'
import { frameSpansOf, withholdingNothing } from './frameSpansOf'

export const readingFrameOf = (word: LessonWord, learner: FrameLearner): FrameSpans => {
  const { frame } = anchorFrameOf(word)
  return frameSpansOf(
    frame,
    learner.lessons.frameTokensOf(word.id, frame),
    learner,
    withholdingNothing,
  )
}
