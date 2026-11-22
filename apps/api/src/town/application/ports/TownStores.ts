import type {
  Accounts,
  BandStartRepository,
  CardRepository,
  CleanUpRepository,
  EarnedSkillRepository,
  LessonSlotRepository,
  PendingReviewRepository,
  PlacementRepository,
  RegionMapReader,
  ReviewLog,
  TownNews,
  TownRepository,
} from '@mygame/domain'
import type { GuidanceDismissals } from './GuidanceDismissals'
import type { SeenTips } from './SeenTips'
import type { TownNewsReader } from './TownNewsReader'
import type { TownReader } from './TownReader'

export type TownStores = {
  readonly accounts: Accounts
  readonly towns: TownRepository
  readonly townsWithSchool: TownReader
  readonly townNews: TownNews & TownNewsReader
  readonly lessonSlots: LessonSlotRepository
  readonly cards: CardRepository
  readonly pendingReviews: PendingReviewRepository
  readonly reviewLog: ReviewLog
  readonly earnedSkills: EarnedSkillRepository
  readonly bandStarts: BandStartRepository
  readonly placements: PlacementRepository
  readonly regionMap: RegionMapReader
  readonly cleanUps: CleanUpRepository
  readonly seenTips: SeenTips
  readonly guidanceDismissals: GuidanceDismissals
}
