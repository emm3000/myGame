import type { Instant, LessonId, PlayerId, WordId } from '@mygame/domain'

export type ChromeProgress = {
  readonly cards: ReadonlyArray<{ readonly wordId: WordId }>
  readonly skills: ReadonlyArray<{ readonly lessonId: LessonId }>
  readonly lessonSlot: { readonly lessonId: LessonId; readonly finishesAt: Instant } | null
}

export interface ChromeProgressReader {
  chromeProgressOf(playerId: PlayerId): Promise<ChromeProgress | undefined>
}
