import type { AccountStores } from './account/application/ports/AccountStores'
import { DrizzleAccounts } from './account/infrastructure/postgres/DrizzleAccounts'
import { DrizzleAccountTokens } from './account/infrastructure/postgres/DrizzleAccountTokens'
import { DrizzleSessions } from './account/infrastructure/postgres/DrizzleSessions'
import { DrizzleBandStarts } from './adapters/postgres/DrizzleBandStarts'
import { DrizzleCardRepository } from './adapters/postgres/DrizzleCardRepository'
import { DrizzleCleanUpRepository } from './adapters/postgres/DrizzleCleanUpRepository'
import { DrizzleEarnedSkills } from './adapters/postgres/DrizzleEarnedSkills'
import { DrizzleGuidanceDismissals } from './adapters/postgres/DrizzleGuidanceDismissals'
import { DrizzleLessonSlots } from './adapters/postgres/DrizzleLessonSlots'
import { DrizzlePendingReviewRepository } from './adapters/postgres/DrizzlePendingReviewRepository'
import { DrizzlePlacements } from './adapters/postgres/DrizzlePlacements'
import { DrizzleRegionMap } from './adapters/postgres/DrizzleRegionMap'
import { DrizzleReviewLog } from './adapters/postgres/DrizzleReviewLog'
import { DrizzleSeenTips } from './adapters/postgres/DrizzleSeenTips'
import { DrizzleTownNews } from './adapters/postgres/DrizzleTownNews'
import { DrizzleTownRepository } from './adapters/postgres/DrizzleTownRepository'
import type { PostgresSession } from './platform/infrastructure/postgres/connectPostgres'
import type { TownStores } from './town/mutateTown'

export type ComposedStores = AccountStores & TownStores

export const composeStores = (transaction: PostgresSession): ComposedStores => ({
  accounts: new DrizzleAccounts(transaction),
  accountTokens: new DrizzleAccountTokens(transaction),
  sessions: new DrizzleSessions(transaction),
  cards: new DrizzleCardRepository(transaction),
  pendingReviews: new DrizzlePendingReviewRepository(transaction),
  reviewLog: new DrizzleReviewLog(transaction),
  towns: new DrizzleTownRepository(transaction, 'lockedForUpdate'),
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
