import type { AccountStores } from '#account/application/ports/AccountStores'
import { DrizzleAccounts } from '#account/infrastructure/postgres/DrizzleAccounts'
import { DrizzleAccountTokens } from '#account/infrastructure/postgres/DrizzleAccountTokens'
import { DrizzleSessions } from '#account/infrastructure/postgres/DrizzleSessions'
import { DrizzleBandStartRepository } from '#holdout/infrastructure/postgres/DrizzleBandStartRepository'
import { DrizzleCardRepository } from '#learning/infrastructure/postgres/DrizzleCardRepository'
import { DrizzlePendingReviewRepository } from '#learning/infrastructure/postgres/DrizzlePendingReviewRepository'
import { DrizzleReviewLog } from '#learning/infrastructure/postgres/DrizzleReviewLog'
import { DrizzlePlacementRepository } from '#placement/infrastructure/postgres/DrizzlePlacementRepository'
import type { PostgresSession } from '#platform/infrastructure/postgres/connectPostgres'
import type { TownStores } from '#town/application/ports/TownStores'
import { DrizzleCleanUpRepository } from '#town/infrastructure/postgres/DrizzleCleanUpRepository'
import { DrizzleEarnedSkillRepository } from '#town/infrastructure/postgres/DrizzleEarnedSkillRepository'
import { DrizzleGuidanceDismissals } from '#town/infrastructure/postgres/DrizzleGuidanceDismissals'
import { DrizzleLessonSlotRepository } from '#town/infrastructure/postgres/DrizzleLessonSlotRepository'
import { DrizzleRegionMapReader } from '#town/infrastructure/postgres/DrizzleRegionMapReader'
import { DrizzleSeenTips } from '#town/infrastructure/postgres/DrizzleSeenTips'
import { DrizzleTownNews } from '#town/infrastructure/postgres/DrizzleTownNews'
import { DrizzleTownReader } from '#town/infrastructure/postgres/DrizzleTownReader'
import { DrizzleTownRepository } from '#town/infrastructure/postgres/DrizzleTownRepository'

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
