import type { LessonId, WordId } from '#learning/Lesson'
import type { PlayerId } from '#player/PlayerId'
import type { Instant } from '#time/Instant'

export type ChromeProgress = {
  readonly cards: ReadonlyArray<{ readonly wordId: WordId }>
  readonly skills: ReadonlyArray<{ readonly lessonId: LessonId }>
  readonly lessonSlot: { readonly lessonId: LessonId; readonly finishesAt: Instant } | null
}

export interface ChromeProgressReader {
  chromeProgressOf(playerId: PlayerId): Promise<ChromeProgress | undefined>
}
