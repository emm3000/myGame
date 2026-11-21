import type { AccountStores } from './account/application/ports/AccountStores'
import { DrizzleAccounts } from './account/infrastructure/postgres/DrizzleAccounts'
import { DrizzleAccountTokens } from './account/infrastructure/postgres/DrizzleAccountTokens'
import { DrizzleSessions } from './account/infrastructure/postgres/DrizzleSessions'
import { DrizzleBandStarts } from './holdout/infrastructure/postgres/DrizzleBandStarts'
import { DrizzleCardRepository } from './learning/infrastructure/postgres/DrizzleCardRepository'
import { DrizzlePendingReviewRepository } from './learning/infrastructure/postgres/DrizzlePendingReviewRepository'
import { DrizzleReviewLog } from './learning/infrastructure/postgres/DrizzleReviewLog'
import { DrizzlePlacements } from './placement/infrastructure/postgres/DrizzlePlacements'
import type { PostgresSession } from './platform/infrastructure/postgres/connectPostgres'
import type { TownStores } from './town/application/mutateTown'
import { DrizzleCleanUpRepository } from './town/infrastructure/postgres/DrizzleCleanUpRepository'
import { DrizzleEarnedSkills } from './town/infrastructure/postgres/DrizzleEarnedSkills'
import { DrizzleGuidanceDismissals } from './town/infrastructure/postgres/DrizzleGuidanceDismissals'
import { DrizzleLessonSlots } from './town/infrastructure/postgres/DrizzleLessonSlots'
import { DrizzleRegionMap } from './town/infrastructure/postgres/DrizzleRegionMap'
import { DrizzleSeenTips } from './town/infrastructure/postgres/DrizzleSeenTips'
import { DrizzleTownNews } from './town/infrastructure/postgres/DrizzleTownNews'
import { DrizzleTownReader } from './town/infrastructure/postgres/DrizzleTownReader'
import { DrizzleTownRepository } from './town/infrastructure/postgres/DrizzleTownRepository'

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
  lessonSlots: new DrizzleLessonSlots(transaction),
  earnedSkills: new DrizzleEarnedSkills(transaction),
  bandStarts: new DrizzleBandStarts(transaction),
  placements: new DrizzlePlacements(transaction),
  regionMap: new DrizzleRegionMap(transaction),
  cleanUps: new DrizzleCleanUpRepository(transaction),
  seenTips: new DrizzleSeenTips(transaction),
  guidanceDismissals: new DrizzleGuidanceDismissals(transaction),
})
