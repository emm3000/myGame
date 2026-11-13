import type {
  BandStart,
  DomainError,
  HeldCard,
  Instant,
  LessonSlot,
  PlacementScore,
  PlayerId,
  Result,
  Scaffold,
  TipKind,
  Town,
  TownRepository,
} from '@mygame/domain'

export type TownWithSchool = {
  readonly town: Town
  readonly lessonSlot: LessonSlot
  readonly cards: ReadonlyArray<HeldCard>
  readonly bandStarts: ReadonlyArray<BandStart>
  readonly placementScores: ReadonlyArray<PlacementScore>
  readonly guidanceDismissedAt: Instant | undefined
  readonly seenTips: ReadonlyArray<TipKind>
  readonly scaffold: Scaffold
}

export interface TownReader extends Omit<TownRepository, 'save'> {
  townWithSchoolOf(playerId: PlayerId): Promise<Result<TownWithSchool | undefined, DomainError>>
}
