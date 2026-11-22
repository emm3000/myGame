import type { WordId } from '../../domain/Lesson'

export type FrameToken = {
  readonly text: string
  readonly wordId: WordId | null
}
