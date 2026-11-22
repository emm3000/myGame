import type { StoredScaffold } from '#account/domain/StoredScaffold'
import { inMemoryAccounts } from '#account/testing/inMemoryAccounts'
import { inMemoryBandStarts } from '#holdout/testing/inMemoryBandStarts'
import { inMemoryPendingReviews } from '#learning/reviews/testing/inMemoryPendingReviews'
import { inMemoryReviewLog } from '#learning/reviews/testing/inMemoryReviewLog'
import { inMemoryCards } from '#learning/testing/inMemoryCards'
import { inMemoryPlacements } from '#placement/testing/inMemoryPlacements'
import type { TownStores } from '../domain/TownStores'
import { MemoryGuidanceDismissals } from '../guidance/testing/MemoryGuidanceDismissals'
import { MemorySeenTips } from '../guidance/testing/MemorySeenTips'
import { inMemoryCleanUps } from '../jobs/testing/inMemoryCleanUps'
import { inMemoryRegionMap } from '../jobs/testing/inMemoryRegionMap'
import { inMemoryLessonSlots } from '../school/testing/inMemoryLessonSlots'
import { inMemoryEarnedSkills } from './inMemoryEarnedSkills'
import { inMemoryTownNews } from './inMemoryTownNews'
import { inMemoryTownReader } from './inMemoryTownReader'
import { inMemoryTowns } from './inMemoryTowns'
import { MemoryTownNewsReader } from './MemoryTownNewsReader'

const defaultScaffold: StoredScaffold = { scaffold: 'es', scaffoldVersion: 1 }

const townNewsOf = (): TownStores['townNews'] => {
  const news = inMemoryTownNews()
  const reader = new MemoryTownNewsReader((townId) => news.recordedEventsOf(townId))
  return {
    record: (townId, events) => news.record(townId, events),
    newsOf: (townId) => reader.newsOf(townId),
    newsAfter: (townId, after) => reader.newsAfter(townId, after),
  }
}

export const inMemoryTownStores = (held: Partial<TownStores>): TownStores => {
  const earnedSkills = held.earnedSkills ?? inMemoryEarnedSkills([])
  const towns = held.towns ?? inMemoryTowns([], earnedSkills)
  const lessonSlots = held.lessonSlots ?? inMemoryLessonSlots([])
  const cards = held.cards ?? inMemoryCards([])
  const bandStarts = held.bandStarts ?? inMemoryBandStarts([])
  return {
    accounts: held.accounts ?? inMemoryAccounts(),
    towns,
    townsWithSchool:
      held.townsWithSchool ??
      inMemoryTownReader({ towns, lessonSlots, cards, bandStarts }, defaultScaffold),
    townNews: held.townNews ?? townNewsOf(),
    lessonSlots,
    cards,
    pendingReviews: held.pendingReviews ?? inMemoryPendingReviews(),
    reviewLog: held.reviewLog ?? inMemoryReviewLog(),
    earnedSkills,
    bandStarts,
    placements: held.placements ?? inMemoryPlacements([]),
    regionMap: held.regionMap ?? inMemoryRegionMap([]),
    cleanUps: held.cleanUps ?? inMemoryCleanUps(),
    seenTips: held.seenTips ?? new MemorySeenTips(),
    guidanceDismissals: held.guidanceDismissals ?? new MemoryGuidanceDismissals(towns),
  }
}
