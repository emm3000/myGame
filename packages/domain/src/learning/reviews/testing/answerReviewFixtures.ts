import { assert } from 'vitest'
import { inMemoryBandStarts } from '#holdout/testing/inMemoryBandStarts'
import { dueInstantOf } from '#memory/dueInstantOf'
import { MemoryCard } from '#memory/MemoryCard'
import type { MemoryRating } from '#memory/MemoryRating'
import { defaultMemoryTerms } from '#memory/MemoryTerms'
import { reviewMemoryCard } from '#memory/reviewMemoryCard'
import type { Clock } from '#ports/Clock'
import { Instant } from '#time/Instant'
import type { BuildingLevel } from '#town/building/BuildingLevel'
import type { WorkSlot } from '#town/building/BuildingWork'
import type { EarnedSkillRepository } from '#town/ports/EarnedSkillRepository'
import type { TownRepository } from '#town/ports/TownRepository'
import { accrueTown } from '#town/resources/accrueTown'
import { Town } from '#town/Town'
import type { TownSkill } from '#town/TownSkill'
import { inMemoryEarnedSkills } from '#town/testing/inMemoryEarnedSkills'
import { type InMemoryTownNews, inMemoryTownNews } from '#town/testing/inMemoryTownNews'
import { type InMemoryTowns, inMemoryTowns } from '#town/testing/inMemoryTowns'
import { plainTownLevels, plainTownSettings, townCatalogOf } from '#town/testing/townCatalogOf'
import { type TownShape, townOf } from '#town/testing/townFixtures'
import type { BandStart } from '../../curriculum/BandStart'
import { inMemoryBands } from '../../curriculum/testing/inMemoryBands'
import { inMemoryLessons } from '../../curriculum/testing/inMemoryLessons'
import { lessonOne } from '../../curriculum/testing/lessonOne'
import type { HeldCard } from '../../HeldCard'
import { heldCardsOf } from '../../HeldCards'
import type { Lesson } from '../../Lesson'
import { type InMemoryCards, inMemoryCards, type OwnedCard } from '../../testing/inMemoryCards'
import type { PendingReview } from '../PendingReview'
import type { PendingReviewRepository } from '../ports/PendingReviewRepository'
import { recognitionChoicesOf } from '../recognitionChoicesOf'
import type { AnswerReviewDependencies } from '../useCases/answerReview'
import { inMemoryPendingReviews } from './inMemoryPendingReviews'
import { type InMemoryReviewLog, inMemoryReviewLog } from './inMemoryReviewLog'

export const MILLISECONDS_PER_MINUTE = 60_000

export const lessonFinish = Instant.fromEpochMilliseconds(1_794_301_200_000)

export const minutesAfterFinish = (minutes: number): Instant =>
  Instant.fromEpochMilliseconds(lessonFinish.epochMilliseconds + minutes * MILLISECONDS_PER_MINUTE)

export const frozenClock = (instant: Instant): Clock => ({ now: () => instant })

export const learner = 'player-1'

export const headwords = ['home', 'school', 'work', 'money', 'food', 'foot', 'house']

export const reviewedAtEachDue = (ratings: ReadonlyArray<MemoryRating>): MemoryCard =>
  ratings.reduce((card, rating) => {
    const dueAt = dueInstantOf(card, defaultMemoryTerms)
    assert(dueAt.ok)
    const next = reviewMemoryCard(card, rating, dueAt.value, defaultMemoryTerms)
    assert(next.ok)
    return next.value
  }, MemoryCard.entered(lessonFinish))

export const dueAtOf = (card: MemoryCard): Instant => {
  const dueAt = dueInstantOf(card, defaultMemoryTerms)
  assert(dueAt.ok)
  return dueAt.value
}

export const cardsOfLessonOne: ReadonlyArray<HeldCard> = lessonOne.words.map(({ id }) => ({
  wordId: id,
  card: MemoryCard.entered(lessonFinish),
}))

export const choiceIdOf = (askedWordId: string, chosenWordId: string, card: MemoryCard): string => {
  const choice = recognitionChoicesOf(
    askedWordId,
    lessonOne,
    card,
    heldCardsOf(cardsOfLessonOne),
  ).find(({ wordId }) => wordId === chosenWordId)
  assert(choice !== undefined)
  return choice.choiceId
}

export const ownedBy = (wordId: string, card: MemoryCard): OwnedCard => ({
  playerId: learner,
  wordId,
  card,
})

export const recallCard = reviewedAtEachDue(['good', 'good'])

export const firstRecallDoneCard = reviewedAtEachDue(['good', 'good', 'good'])

export const retainedCard = reviewedAtEachDue(['good', 'good', 'good', 'good'])

export const MILLISECONDS_PER_HOUR = 3_600_000

export const hoursAfter = (instant: Instant, hours: number): Instant =>
  Instant.fromEpochMilliseconds(instant.epochMilliseconds + hours * MILLISECONDS_PER_HOUR)

export const homesUpToTen: ReadonlyArray<BuildingLevel> = [
  ...plainTownLevels,
  ...[3, 4, 5, 6, 7, 8, 9, 10].map(
    (level): BuildingLevel => ({
      building: 'homes',
      level,
      cost: { money: 0, food: 0, power: 0, material: 0 },
      durationSeconds: 60 * level,
      people: 0,
      peopleSupplied: 20 * level,
    }),
  ),
]

export const catalog = townCatalogOf(plainTownSettings, homesUpToTen)

export const cardsHeldAs = (
  standing: string,
  count: number,
  card: MemoryCard,
): ReadonlyArray<OwnedCard> =>
  Array.from({ length: count }, (_, index) => ownedBy(`${standing}-${index + 1}`, card))

export const stableCardsOf = (count: number): ReadonlyArray<OwnedCard> =>
  cardsHeldAs('stable', count, firstRecallDoneCard)

export const retainedCardsOf = (count: number): ReadonlyArray<OwnedCard> =>
  cardsHeldAs('retained', count, retainedCard)

export const lastRecallAt = dueAtOf(firstRecallDoneCard)

export const retainedExceptSchool = (schoolCard: MemoryCard): ReadonlyArray<OwnedCard> => [
  ownedBy('home', retainedCard),
  ownedBy('work', retainedCard),
  ownedBy('money', retainedCard),
  ownedBy('food', retainedCard),
  ownedBy('school', schoolCard),
]

export const farmingTownStoredAt = (storedAt: Instant, shape: Partial<TownShape> = {}): Town =>
  townOf({ area: 2, buildingLevels: { farm: 2 }, storedAt, ...shape })

export const earnedFoodSkill: TownSkill = {
  lessonId: lessonOne.id,
  resource: 'food',
  ratePercent: 5,
  earnedAt: lastRecallAt,
}

export type AnswerReviewFixture = {
  readonly towns: InMemoryTowns
  readonly skills: EarnedSkillRepository
  readonly news: InMemoryTownNews
  readonly cards: InMemoryCards
  readonly pendingReviews: PendingReviewRepository
  readonly reviewLog: InMemoryReviewLog
  readonly dependencies: AnswerReviewDependencies
}

export const arrange = (
  owned: ReadonlyArray<OwnedCard>,
  now: Instant,
  heldTowns: ReadonlyArray<Town> = [farmingTownStoredAt(now)],
  starts: ReadonlyArray<BandStart> = [],
): AnswerReviewFixture => {
  const towns = inMemoryTowns(heldTowns)
  const skills = inMemoryEarnedSkills([])
  const news = inMemoryTownNews()
  const cards = inMemoryCards(owned)
  const pendingReviews = inMemoryPendingReviews()
  const reviewLog = inMemoryReviewLog()
  const dependencies = {
    cards,
    pendingReviews,
    reviewLog,
    lessons: inMemoryLessons([lessonOne], headwords),
    bandStarts: inMemoryBandStarts(starts.map((start) => ({ playerId: learner, start }))),
    bands: inMemoryBands([{ band: 1, lessonIds: [lessonOne.id], words: bandWordsOfLessonOne }]),
    clock: frozenClock(now),
    terms: defaultMemoryTerms,
    skills,
    towns,
    news,
    catalog,
  }
  return { towns, skills, news, cards, pendingReviews, reviewLog, dependencies }
}

export const bandWordsOfLessonOne = lessonOne.words.map(({ acceptedForms }) => ({
  headword: acceptedForms[0],
  isChrome: false,
}))

export const schoolReleasedAt = (releasedAt: Instant): BandStart => ({
  band: 1,
  startedAt: lessonFinish,
  heldOutWords: ['school'],
  checks: [{ kind: 'skipped', week: 24, skippedAt: releasedAt }],
})

export const lessonWithALaterFrame: Lesson = {
  ...lessonOne,
  words: lessonOne.words.map((word) =>
    word.id === 'school'
      ? {
          ...word,
          frames: [
            word.frames[0],
            {
              frame: 'My school is new.',
              gappedFrame: 'My ____ is new.',
              fromLessonId: 'lesson-2',
            },
          ],
        }
      : word,
  ),
}

export const shownAs = (shownFrame: string): PendingReview => ({
  hintShown: false,
  nearMissAnswer: null,
  shownFrame,
})

export const skillsOf = async (
  skills: EarnedSkillRepository,
): Promise<ReadonlyArray<TownSkill>> => {
  const earned = await skills.skillsOf(learner)
  assert(earned.ok)
  return earned.value
}

export const foodAt = (town: Town | undefined, at: Instant): number => {
  assert(town !== undefined)
  const accrual = accrueTown(town, catalog, at)
  assert(accrual.ok)
  return accrual.value.stocks.food
}

export const townsLoadingSkillsFrom = (
  towns: InMemoryTowns,
  skills: EarnedSkillRepository,
): TownRepository => ({
  ...towns,
  townOf: async (playerId) => {
    const stored = towns.storedTownOf(playerId)
    const earned = await skills.skillsOf(playerId)
    assert(stored !== undefined && earned.ok)
    const { id, name, address, stocks, storedAt, fullSince, buildingLevels } = stored
    return Town.restore({
      id,
      playerId,
      name,
      address,
      stocks,
      storedAt,
      fullSince,
      buildingLevels,
      workSlot: stored.workSlot,
      waitingList: stored.waitingList,
      skills: earned.value,
      hires: stored.hires,
      hiringSlot: stored.hiringSlot,
      jobSlot: stored.jobSlot,
    })
  },
})

export const factoryFinishedAt = (finishesAt: Instant, startedAt: Instant): WorkSlot => ({
  kind: 'busy',
  building: 'factory',
  level: 1,
  cost: { money: 0, food: 0, power: 0, material: 0 },
  startedAt,
  finishesAt,
})

export const heldCardOf = (cards: ReturnType<typeof inMemoryCards>, wordId: string): HeldCard => {
  const held = cards.heldCardOf(learner, wordId)
  assert(held !== undefined)
  return held
}
