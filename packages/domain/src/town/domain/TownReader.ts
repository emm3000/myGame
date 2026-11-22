import type { StoredScaffold } from '#account/domain/StoredScaffold'
import type { DomainError } from '#DomainError'
import type { BandStart } from '#holdout/domain/BandStart'
import type { HeldCard } from '#learning/HeldCard'
import type { PlacementScore } from '#placement/domain/Placement'
import type { PlayerId } from '#player/PlayerId'
import type { Result } from '#Result'
import type { Instant } from '#time/Instant'
import type { TipKind } from '../guidance/domain/TipKind'
import type { LessonSlot } from '../school/domain/LessonSlot'
import type { Town } from './Town'

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
