import type {
  DomainError,
  Headword,
  HeldCard,
  LessonSlot,
  PlayerId,
  Result,
  Town,
  TownRepository,
} from '@mygame/domain'

export type TownWithSchool = {
  readonly town: Town
  readonly lessonSlot: LessonSlot
  readonly cards: ReadonlyArray<HeldCard>
  readonly heldOutWords: ReadonlyArray<Headword>
}

export interface TownReader extends Omit<TownRepository, 'save'> {
  townWithSchoolOf(playerId: PlayerId): Promise<Result<TownWithSchool | undefined, DomainError>>
}
