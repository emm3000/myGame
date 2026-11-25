import type { Accounts } from '#account/domain/Accounts'
import type { BandStartRepository } from '#holdout/domain/BandStartRepository'
import type { CardRepository } from '#learning/domain/CardRepository'
import type { PendingReviewRepository } from '#learning/reviews/domain/PendingReviewRepository'
import type { ReviewLog } from '#learning/reviews/domain/ReviewLog'
import type { PlacementRepository } from '#placement/domain/PlacementRepository'
import type { SeenTowns } from '../away/domain/SeenTowns'
import type { GuidanceDismissals } from '../guidance/domain/GuidanceDismissals'
import type { SeenTips } from '../guidance/domain/SeenTips'
import type { CleanUpRepository } from '../jobs/domain/CleanUpRepository'
import type { RegionMapReader } from '../jobs/domain/RegionMapReader'
import type { LessonSlotRepository } from '../school/domain/LessonSlotRepository'
import type { EarnedSkillRepository } from './EarnedSkillRepository'
import type { TownNews } from './TownNews'
import type { TownNewsReader } from './TownNewsReader'
import type { TownReader } from './TownReader'
import type { TownRepository } from './TownRepository'

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
  readonly seenTowns: SeenTowns
}
