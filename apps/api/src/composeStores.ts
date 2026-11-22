import type { AccountStores, TownStores } from '@mygame/domain'
import { DrizzleAccounts } from '#account/infrastructure/persistence/DrizzleAccounts'
import { DrizzleAccountTokens } from '#account/infrastructure/persistence/DrizzleAccountTokens'
import { DrizzleSessions } from '#account/infrastructure/persistence/DrizzleSessions'
import { DrizzleBandStartRepository } from '#holdout/infrastructure/persistence/DrizzleBandStartRepository'
import { DrizzleCardRepository } from '#learning/infrastructure/persistence/DrizzleCardRepository'
import { DrizzlePendingReviewRepository } from '#learning/infrastructure/persistence/DrizzlePendingReviewRepository'
import { DrizzleReviewLog } from '#learning/infrastructure/persistence/DrizzleReviewLog'
import { DrizzlePlacementRepository } from '#placement/infrastructure/persistence/DrizzlePlacementRepository'
import type { PostgresSession } from '#platform/infrastructure/persistence/connectPostgres'
import { DrizzleCleanUpRepository } from '#town/infrastructure/persistence/DrizzleCleanUpRepository'
import { DrizzleEarnedSkillRepository } from '#town/infrastructure/persistence/DrizzleEarnedSkillRepository'
import { DrizzleGuidanceDismissals } from '#town/infrastructure/persistence/DrizzleGuidanceDismissals'
import { DrizzleLessonSlotRepository } from '#town/infrastructure/persistence/DrizzleLessonSlotRepository'
import { DrizzleRegionMapReader } from '#town/infrastructure/persistence/DrizzleRegionMapReader'
import { DrizzleSeenTips } from '#town/infrastructure/persistence/DrizzleSeenTips'
import { DrizzleTownNews } from '#town/infrastructure/persistence/DrizzleTownNews'
import { DrizzleTownReader } from '#town/infrastructure/persistence/DrizzleTownReader'
import { DrizzleTownRepository } from '#town/infrastructure/persistence/DrizzleTownRepository'

export type ComposedStores = AccountStores & TownStores

export const composeStores = (transaction: PostgresSession): ComposedStores => ({
  accounts: new DrizzleAccounts(transaction),
  accountTokens: new DrizzleAccountTokens(transaction),
  sessions: new DrizzleSessions(transaction),
  cards: new DrizzleCardRepository(transaction),
  pendingReviews: new DrizzlePendingReviewRepository(transaction),
  reviewLog: new DrizzleReviewLog(transaction),
  towns: new DrizzleTownRepository(transaction, 'lockedForUpdate'),
  townsWithSchool: new DrizzleTownReader(transaction),
  townNews: new DrizzleTownNews(transaction),
  lessonSlots: new DrizzleLessonSlotRepository(transaction),
  earnedSkills: new DrizzleEarnedSkillRepository(transaction),
  bandStarts: new DrizzleBandStartRepository(transaction),
  placements: new DrizzlePlacementRepository(transaction),
  regionMap: new DrizzleRegionMapReader(transaction),
  cleanUps: new DrizzleCleanUpRepository(transaction),
  seenTips: new DrizzleSeenTips(transaction),
  guidanceDismissals: new DrizzleGuidanceDismissals(transaction),
})
