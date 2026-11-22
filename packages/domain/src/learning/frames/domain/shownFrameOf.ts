import type { MemoryCard } from '#memory/domain/MemoryCard'
import type { Stage } from '../../curriculum/domain/stageOf'
import type { LessonWord } from '../../domain/Lesson'
import { reviewFormatOf } from '../../reviews/domain/ReviewFormat'
import { anchorFrameOf } from './anchorFrameOf'
import { recallFrameOf } from './recallFrameOf'

export const shownFrameOf = (word: LessonWord, card: MemoryCard, stage: Stage): string =>
  reviewFormatOf(card) === 'recall'
    ? recallFrameOf(word, card, stage).gappedFrame
    : anchorFrameOf(word).frame
