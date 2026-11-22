import { keyedTextHashOf } from '#hash/keyedTextHashOf'
import { mixed32 } from '#hash/mixed32'
import type { MemoryCard } from '#memory/domain/MemoryCard'
import type { Stage } from '../../curriculum/domain/stageOf'
import { keyInstantOf } from '../../domain/keyInstantOf'
import type { LessonWord } from '../../domain/Lesson'
import type { WordFrame } from './WordFrame'

export const recallFrameOf = (
  { id, frames: [anchor, ...laterFrames] }: LessonWord,
  card: MemoryCard,
  stage: Stage,
): WordFrame => {
  const wordHash = keyedTextHashOf(id, keyInstantOf(card).epochMilliseconds)
  const [shown] = laterFrames
    .map((frame, index) => ({ frame, hash: mixed32(wordHash ^ (index + 1)) }))
    .filter(({ frame }) => stage.includes(frame.fromLessonId))
    .sort((left, right) => left.hash - right.hash)
  return shown?.frame ?? anchor
}
