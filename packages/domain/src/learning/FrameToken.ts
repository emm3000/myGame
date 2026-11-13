import type { WordId } from './Lesson'

export type FrameToken = {
  readonly text: string
  readonly wordId: WordId | null
}
