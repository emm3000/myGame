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
import { type InMemoryTownNews, inMemoryTownNews } from './inMemoryTownNews'
import { inMemoryTownReader } from './inMemoryTownReader'
import { inMemoryTowns } from './inMemoryTowns'
import { MemoryTownNewsReader } from './MemoryTownNewsReader'

export type HeldTownStores = Partial<Omit<TownStores, 'seenTips' | 'guidanceDismissals'>> & {
  readonly seenTips?: MemorySeenTips
  readonly guidanceDismissals?: MemoryGuidanceDismissals
}

export const townNewsOver = (news: InMemoryTownNews): TownStores['townNews'] => {
  const reader = new MemoryTownNewsReader((townId) => news.recordedEventsOf(townId))
  return {
    record: (townId, events) => news.record(townId, events),
    newsOf: (townId) => reader.newsOf(townId),
    newsAfter: (townId, after) => reader.newsAfter(townId, after),
  }
}

export const inMemoryTownStores = (held: HeldTownStores): TownStores => {
  const accounts = held.accounts ?? inMemoryAccounts()
  const earnedSkills = held.earnedSkills ?? inMemoryEarnedSkills([])
  const towns = held.towns ?? inMemoryTowns([], earnedSkills)
  const lessonSlots = held.lessonSlots ?? inMemoryLessonSlots([])
  const cards = held.cards ?? inMemoryCards([])
  const bandStarts = held.bandStarts ?? inMemoryBandStarts([])
  const placements = held.placements ?? inMemoryPlacements([])
  const seenTips = held.seenTips ?? new MemorySeenTips()
  const guidanceDismissals = held.guidanceDismissals ?? new MemoryGuidanceDismissals(towns)
  return {
    accounts,
    towns,
    townsWithSchool:
      held.townsWithSchool ??
      inMemoryTownReader({
        accounts,
        towns,
        lessonSlots,
        cards,
        bandStarts,
        placements,
        guidanceDismissals,
        seenTips,
      }),
    townNews: held.townNews ?? townNewsOver(inMemoryTownNews()),
    lessonSlots,
    cards,
    pendingReviews: held.pendingReviews ?? inMemoryPendingReviews(),
    reviewLog: held.reviewLog ?? inMemoryReviewLog(),
    earnedSkills,
    bandStarts,
    placements,
    regionMap: held.regionMap ?? inMemoryRegionMap([]),
    cleanUps: held.cleanUps ?? inMemoryCleanUps(),
    seenTips,
    guidanceDismissals,
  }
}
