import { anchorFrameOf } from './anchorFrameOf'
import type { FrameReader } from './FrameReader'
import type { FrameSpans } from './FrameSpan'
import { frameSpansOf, withholdingNothing } from './frameSpansOf'
import type { LessonWord } from './Lesson'

export const readingFrameOf = (word: LessonWord, reader: FrameReader): FrameSpans => {
  const { frame } = anchorFrameOf(word)
  return frameSpansOf(
    frame,
    reader.lessons.frameTokensOf(word.id, frame),
    reader,
    withholdingNothing,
  )
}
