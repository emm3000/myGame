import type { Instant, LessonId, PlayerId, WordId } from '@mygame/domain'
import type { ChromeProgress, ChromeProgressReader } from '../../learning/ChromeProgressReader'

type RunningLesson = NonNullable<ChromeProgress['lessonSlot']>

const byText = (left: string, right: string): number => (left < right ? -1 : Number(left > right))

export class MemoryChromeProgress implements ChromeProgressReader {
  private readonly players = new Set<PlayerId>()
  private readonly towns = new Set<PlayerId>()
  private readonly cards = new Map<PlayerId, ReadonlyArray<WordId>>()
  private readonly skills = new Map<PlayerId, ReadonlyArray<LessonId>>()
  private readonly lessons = new Map<PlayerId, RunningLesson>()

  async chromeProgressOf(playerId: PlayerId): Promise<ChromeProgress | undefined> {
    if (!this.players.has(playerId)) {
      return undefined
    }
    return {
      cards: [...(this.cards.get(playerId) ?? [])].sort(byText).map((wordId) => ({ wordId })),
      skills: [...(this.skills.get(playerId) ?? [])].sort(byText).map((lessonId) => ({ lessonId })),
      lessonSlot: this.towns.has(playerId) ? (this.lessons.get(playerId) ?? null) : null,
    }
  }

  addPlayer(playerId: PlayerId): void {
    this.players.add(playerId)
  }

  holdCard(playerId: PlayerId, wordId: WordId): void {
    this.cards.set(playerId, [...(this.cards.get(playerId) ?? []), wordId])
  }

  earnSkill(playerId: PlayerId, lessonId: LessonId): void {
    this.skills.set(playerId, [...(this.skills.get(playerId) ?? []), lessonId])
  }

  foundTown(playerId: PlayerId): void {
    this.towns.add(playerId)
  }

  runLesson(playerId: PlayerId, lessonId: LessonId, finishesAt: Instant): void {
    this.lessons.set(playerId, { lessonId, finishesAt })
  }
}
