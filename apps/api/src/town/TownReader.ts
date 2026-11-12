import type {
  DomainError,
  Headword,
  HeldCard,
  Instant,
  LessonSlot,
  PlacementScore,
  PlayerId,
  Result,
  TipKind,
  Town,
  TownRepository,
} from '@mygame/domain'

export type TownWithSchool = {
  readonly town: Town
  readonly lessonSlot: LessonSlot
  readonly cards: ReadonlyArray<HeldCard>
  readonly heldOutWords: ReadonlyArray<Headword>
  readonly placementScores: ReadonlyArray<PlacementScore>
  readonly guidanceDismissedAt: Instant | undefined
  readonly seenTips: ReadonlyArray<TipKind>
}

export interface TownReader extends Omit<TownRepository, 'save'> {
  townWithSchoolOf(playerId: PlayerId): Promise<Result<TownWithSchool | undefined, DomainError>>
}
