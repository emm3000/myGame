import type {
  BandStartRepository,
  CardRepository,
  CleanUpRepository,
  EarnedSkillRepository,
  LessonSlotRepository,
  PendingReviewRepository,
  RegionMapReader,
  Result,
  ReviewLog,
  TownNews,
  TownRepository,
} from '@mygame/domain'
import { TransactionRollbackError } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { Accounts } from '../../auth/Accounts'
import type { AccountTokens } from '../../auth/AccountTokens'
import type { TownNewsReader } from '../../town/TownNewsReader'
import { DrizzleAccounts } from './DrizzleAccounts'
import { DrizzleAccountTokens } from './DrizzleAccountTokens'
import { DrizzleBandStarts } from './DrizzleBandStarts'
import { DrizzleCardRepository } from './DrizzleCardRepository'
import { DrizzleCleanUpRepository } from './DrizzleCleanUpRepository'
import { DrizzleEarnedSkills } from './DrizzleEarnedSkills'
import { DrizzleLessonSlots } from './DrizzleLessonSlots'
import { DrizzlePendingReviewRepository } from './DrizzlePendingReviewRepository'
import { DrizzleRegionMap } from './DrizzleRegionMap'
import { DrizzleReviewLog } from './DrizzleReviewLog'
import { DrizzleTownNews } from './DrizzleTownNews'
import { DrizzleTownRepository } from './DrizzleTownRepository'

export type TransactionStores = {
  readonly accounts: Accounts
  readonly accountTokens: AccountTokens
  readonly cards: CardRepository
  readonly pendingReviews: PendingReviewRepository
  readonly reviewLog: ReviewLog
  readonly towns: TownRepository
  readonly townNews: TownNews & TownNewsReader
  readonly lessonSlots: LessonSlotRepository
  readonly earnedSkills: EarnedSkillRepository
  readonly bandStarts: BandStartRepository
  readonly regionMap: RegionMapReader
  readonly cleanUps: CleanUpRepository
}

export type Transaction = <T, E>(
  work: (stores: TransactionStores) => Promise<Result<T, E>>,
) => Promise<Result<T, E>>

export const postgresTransaction =
  (database: NodePgDatabase): Transaction =>
  async <T, E>(
    work: (stores: TransactionStores) => Promise<Result<T, E>>,
  ): Promise<Result<T, E>> => {
    let refused: Result<T, E> | undefined
    try {
      return await database.transaction(async (transaction) => {
        const outcome = await work({
          accounts: new DrizzleAccounts(transaction),
          accountTokens: new DrizzleAccountTokens(transaction),
          cards: new DrizzleCardRepository(transaction),
          pendingReviews: new DrizzlePendingReviewRepository(transaction),
          reviewLog: new DrizzleReviewLog(transaction),
          towns: new DrizzleTownRepository(transaction, 'lockedForUpdate'),
          townNews: new DrizzleTownNews(transaction),
          lessonSlots: new DrizzleLessonSlots(transaction),
          earnedSkills: new DrizzleEarnedSkills(transaction),
          bandStarts: new DrizzleBandStarts(transaction),
          regionMap: new DrizzleRegionMap(transaction),
          cleanUps: new DrizzleCleanUpRepository(transaction),
        })
        if (!outcome.ok) {
          refused = outcome
          transaction.rollback()
        }
        return outcome
      })
    } catch (failure) {
      if (failure instanceof TransactionRollbackError && refused !== undefined) {
        return refused
      }
      throw failure
    }
  }
