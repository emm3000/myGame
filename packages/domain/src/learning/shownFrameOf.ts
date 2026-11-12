import type { MemoryCard } from '../memory/MemoryCard'
import { anchorFrameOf } from './anchorFrameOf'
import type { LessonWord } from './Lesson'
import { reviewFormatOf } from './ReviewFormat'
import { recallFrameOf } from './recallFrameOf'
import type { Stage } from './stageOf'

export const shownFrameOf = (word: LessonWord, card: MemoryCard, stage: Stage): string =>
  reviewFormatOf(card) === 'recall'
    ? recallFrameOf(word, card, stage).gappedFrame
    : anchorFrameOf(word).frame
