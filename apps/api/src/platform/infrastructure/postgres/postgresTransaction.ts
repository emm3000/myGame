import type {
  BandStartRepository,
  CardRepository,
  CleanUpRepository,
  EarnedSkillRepository,
  LessonSlotRepository,
  PendingReviewRepository,
  PlacementRepository,
  RegionMapReader,
  Result,
  ReviewLog,
  TownNews,
  TownRepository,
} from '@mygame/domain'
import { sql, TransactionRollbackError } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { DrizzleAccounts } from '../../../adapters/postgres/DrizzleAccounts'
import { DrizzleAccountTokens } from '../../../adapters/postgres/DrizzleAccountTokens'
import { DrizzleBandStarts } from '../../../adapters/postgres/DrizzleBandStarts'
import { DrizzleCardRepository } from '../../../adapters/postgres/DrizzleCardRepository'
import { DrizzleCleanUpRepository } from '../../../adapters/postgres/DrizzleCleanUpRepository'
import { DrizzleEarnedSkills } from '../../../adapters/postgres/DrizzleEarnedSkills'
import { DrizzleGuidanceDismissals } from '../../../adapters/postgres/DrizzleGuidanceDismissals'
import { DrizzleLessonSlots } from '../../../adapters/postgres/DrizzleLessonSlots'
import { DrizzlePendingReviewRepository } from '../../../adapters/postgres/DrizzlePendingReviewRepository'
import { DrizzlePlacements } from '../../../adapters/postgres/DrizzlePlacements'
import { DrizzleRegionMap } from '../../../adapters/postgres/DrizzleRegionMap'
import { DrizzleReviewLog } from '../../../adapters/postgres/DrizzleReviewLog'
import { DrizzleSeenTips } from '../../../adapters/postgres/DrizzleSeenTips'
import { DrizzleTownNews } from '../../../adapters/postgres/DrizzleTownNews'
import { DrizzleTownRepository } from '../../../adapters/postgres/DrizzleTownRepository'
import type { Accounts } from '../../../auth/Accounts'
import type { AccountTokens } from '../../../auth/AccountTokens'
import type { GuidanceDismissals } from '../../../town/GuidanceDismissals'
import type { SeenTips } from '../../../town/SeenTips'
import type { TownNewsReader } from '../../../town/TownNewsReader'
import type { TownReader } from '../../../town/TownReader'

export const statementTimeoutMilliseconds = 2_000

const statementTimeout = sql.raw(`SET LOCAL statement_timeout = ${statementTimeoutMilliseconds}`)

export type TransactionStores = {
  readonly accounts: Accounts
  readonly accountTokens: AccountTokens
  readonly cards: CardRepository
  readonly pendingReviews: PendingReviewRepository
  readonly reviewLog: ReviewLog
  readonly towns: TownRepository & Pick<TownReader, 'townWithSchoolOf'>
  readonly townNews: TownNews & TownNewsReader
  readonly lessonSlots: LessonSlotRepository
  readonly earnedSkills: EarnedSkillRepository
  readonly bandStarts: BandStartRepository
  readonly placements: PlacementRepository
  readonly regionMap: RegionMapReader
  readonly cleanUps: CleanUpRepository
  readonly seenTips: SeenTips
  readonly guidanceDismissals: GuidanceDismissals
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
        await transaction.execute(statementTimeout)
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
          placements: new DrizzlePlacements(transaction),
          regionMap: new DrizzleRegionMap(transaction),
          cleanUps: new DrizzleCleanUpRepository(transaction),
          seenTips: new DrizzleSeenTips(transaction),
          guidanceDismissals: new DrizzleGuidanceDismissals(transaction),
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
