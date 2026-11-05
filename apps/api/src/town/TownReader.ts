import type { DomainError, HeldCard, PlayerId, Result } from '@mygame/domain'
import type { LessonSlot, Town, TownRepository } from '@mygame/domain/town'

export type TownWithSchool = {
  readonly town: Town
  readonly lessonSlot: LessonSlot
  readonly cards: ReadonlyArray<HeldCard>
}

export interface TownReader extends Omit<TownRepository, 'save'> {
  townWithSchoolOf(playerId: PlayerId): Promise<Result<TownWithSchool | undefined, DomainError>>
}
