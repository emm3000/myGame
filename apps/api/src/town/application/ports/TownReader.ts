import type {
  BandStart,
  DomainError,
  HeldCard,
  Instant,
  LessonSlot,
  PlacementScore,
  PlayerId,
  Result,
  TipKind,
  Town,
} from '@mygame/domain'
import type { StoredScaffold } from '#account/application/ports/StoredScaffold'

export type TownWithSchool = StoredScaffold & {
  readonly town: Town
  readonly lessonSlot: LessonSlot
  readonly cards: ReadonlyArray<HeldCard>
  readonly bandStarts: ReadonlyArray<BandStart>
  readonly placementScores: ReadonlyArray<PlacementScore>
  readonly guidanceDismissedAt: Instant | undefined
  readonly seenTips: ReadonlyArray<TipKind>
}

export interface TownReader {
  townWithSchoolOf(playerId: PlayerId): Promise<Result<TownWithSchool | undefined, DomainError>>
}
