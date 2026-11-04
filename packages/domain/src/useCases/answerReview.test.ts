import { assert, describe, expect, it } from 'vitest'
import { Fief, type StoredFief } from '../fief/Fief'
import { noStoreFull } from '../fief/FullSince'
import { materializeStocks } from '../fief/materializeStocks'
import type { HeldCard } from '../learning/HeldCard'
import { dueInstantOf } from '../memory/dueInstantOf'
import { MemoryCard } from '../memory/MemoryCard'
import type { MemoryRating } from '../memory/MemoryRating'
import { defaultMemoryTerms } from '../memory/MemoryTerms'
import { reviewMemoryCard } from '../memory/reviewMemoryCard'
import type { BuildingCatalog, FiefSettings } from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import { inMemoryCards, type OwnedCard } from '../testing/inMemoryCards'
import { inMemoryFiefRepository } from '../testing/inMemoryFiefRepository'
import { inMemoryLessons } from '../testing/inMemoryLessons'
import { inMemoryPendingReviews } from '../testing/inMemoryPendingReviews'
import { inMemoryReviewLog } from '../testing/inMemoryReviewLog'
import { lessonOne } from '../testing/lessonOne'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { Instant } from '../time/Instant'
import { answerReview } from './answerReview'

const MILLISECONDS_PER_MINUTE = 60_000

const lessonFinish = Instant.fromEpochMilliseconds(1_794_301_200_000)

const minutesAfterFinish = (minutes: number): Instant =>
  Instant.fromEpochMilliseconds(lessonFinish.epochMilliseconds + minutes * MILLISECONDS_PER_MINUTE)

const frozenClock = (instant: Instant): Clock => ({ now: () => instant })

const learner = 'player-learner'

const headwords = ['home', 'school', 'work', 'money', 'food', 'foot', 'house']

const reviewedAtEachDue = (ratings: ReadonlyArray<MemoryRating>): MemoryCard =>
  ratings.reduce((card, rating) => {
    const dueAt = dueInstantOf(card, defaultMemoryTerms)
    assert(dueAt.ok)
    const next = reviewMemoryCard(card, rating, dueAt.value, defaultMemoryTerms)
    assert(next.ok)
    return next.value
  }, MemoryCard.entered(lessonFinish))

const dueAtOf = (card: MemoryCard): Instant => {
  const dueAt = dueInstantOf(card, defaultMemoryTerms)
  assert(dueAt.ok)
  return dueAt.value
}

const ownedBy = (wordId: string, card: MemoryCard): OwnedCard => ({
  playerId: learner,
  wordId,
  card,
})

const recallCard = reviewedAtEachDue(['good', 'good'])

const firstRecallDoneCard = reviewedAtEachDue(['good', 'good', 'good'])

const retainedCard = reviewedAtEachDue(['good', 'good', 'good', 'good'])

const MILLISECONDS_PER_HOUR = 3_600_000

const hoursAfter = (instant: Instant, hours: number): Instant =>
  Instant.fromEpochMilliseconds(instant.epochMilliseconds + hours * MILLISECONDS_PER_HOUR)

const fiefSettings: FiefSettings = {
  startingStocks: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  startingCapacity: 1_000_000,
  basePeasantSupply: 4,
  plotsPerProvince: 15,
  baseRates: { wood: 10, stone: 10, iron: 5, gold: 2, food: 20 },
  terrainBonus: {
    lowlands: { resource: 'stone', ratePerHour: 10 },
    uplands: { resource: 'stone', ratePerHour: 10 },
    ridges: { resource: 'stone', ratePerHour: 10 },
  },
  buildQueueCap: 4,
  goals: [],
  fiefCap: 2,
  units: plainUnits,
  forage: plainForage,
  camps: plainCamps,
  seasons: neutralSeasons,
}

const catalog: BuildingCatalog = {
  levelOf: () => undefined,
  artLevelOf: () => undefined,
  fiefSettings: () => fiefSettings,
}

const fiefOfLearner = (id: string, plot: number, storedAt: Instant): Fief => {
  const stored: StoredFief = {
    id,
    playerId: learner,
    name: 'Vado Viejo',
    address: { kingdom: 1, province: 3, plot },
    stocks: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    storedAt,
    buildingLevels: {
      sawmill: 0,
      quarry: 0,
      ironMine: 0,
      farm: 0,
      warehouse: 0,
      library: 1,
      barracks: 0,
    },
    artLevels: { smithing: 0, masonry: 0 },
    units: { infantry: 0, cavalry: 0, archer: 0, settler: 0 },
    slot: { kind: 'idle' },
    buildQueue: [],
    studySlot: { kind: 'idle' },
    recruitOrder: { kind: 'idle' },
    march: { kind: 'idle' },
    fullSince: noStoreFull,
    guidanceDismissedAt: null,
    skills: [],
  }
  const restored = Fief.restore(stored)
  assert(restored.ok)
  return restored.value
}

const foodAt = (fief: Fief | undefined, at: Instant): number => {
  assert(fief !== undefined)
  const stocks = materializeStocks(fief, catalog, at)
  assert(stocks.ok)
  return stocks.value.food
}

const lastRecallAt = dueAtOf(firstRecallDoneCard)

const retainedExceptSchool = (schoolCard: MemoryCard): ReadonlyArray<OwnedCard> => [
  ownedBy('home', retainedCard),
  ownedBy('work', retainedCard),
  ownedBy('money', retainedCard),
  ownedBy('food', retainedCard),
  ownedBy('school', schoolCard),
]

const arrange = (
  owned: ReadonlyArray<OwnedCard>,
  now: Instant,
  heldFiefs: ReadonlyArray<Fief> = [fiefOfLearner('fief-1', 1, now)],
) => {
  const fiefs = inMemoryFiefRepository(heldFiefs)
  const cards = inMemoryCards(owned)
  const pendingReviews = inMemoryPendingReviews()
  const reviewLog = inMemoryReviewLog()
  const dependencies = {
    fiefs,
    catalog,
    cards,
    pendingReviews,
    reviewLog,
    lessons: inMemoryLessons([lessonOne], headwords),
    clock: frozenClock(now),
    terms: defaultMemoryTerms,
  }
  return { fiefs, cards, pendingReviews, reviewLog, dependencies }
}

const heldCardOf = (cards: ReturnType<typeof inMemoryCards>, wordId: string): HeldCard => {
  const held = cards.heldCardOf(learner, wordId)
  assert(held !== undefined)
  return held
}

describe('answerReview', () => {
  it('refuses a word no lesson holds', async () => {
    const { dependencies } = arrange([], lessonFinish)

    const answered = await answerReview(
      { playerId: learner, wordId: 'castle', answer: 'castle' },
      dependencies,
    )

    expect(answered).toEqual({ ok: false, error: { kind: 'UnknownWord', wordId: 'castle' } })
  })

  it('refuses a word the player holds no card of', async () => {
    const { dependencies } = arrange([], lessonFinish)

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    expect(answered).toEqual({ ok: false, error: { kind: 'WordNotHeld', wordId: 'school' } })
  })

  it('refuses a review that is not due and writes nothing', async () => {
    const dueAt = dueAtOf(recallCard)
    const oneMillisecondEarly = Instant.fromEpochMilliseconds(dueAt.epochMilliseconds - 1)
    const { cards, reviewLog, dependencies } = arrange(
      [ownedBy('school', recallCard)],
      oneMillisecondEarly,
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    expect(answered).toEqual({
      ok: false,
      error: { kind: 'ReviewNotDue', wordId: 'school', dueAt },
    })
    expect(heldCardOf(cards, 'school').card).toBe(recallCard)
    expect(reviewLog.entries()).toEqual([])
  })

  it('rates the right recognition Good and steps the card through FSRS', async () => {
    const entered = MemoryCard.entered(lessonFinish)
    const { cards, dependencies } = arrange([ownedBy('school', entered)], lessonFinish)

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'good' })
    expect(heldCardOf(cards, 'school').card.stored).toMatchObject({
      state: 'learning',
      step: 1,
      lastReviewAt: lessonFinish,
    })
    expect(dueAtOf(heldCardOf(cards, 'school').card)).toEqual(minutesAfterFinish(10))
  })

  it('rates the wrong recognition Again', async () => {
    const { dependencies } = arrange(
      [ownedBy('school', MemoryCard.entered(lessonFinish))],
      lessonFinish,
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'home' },
      dependencies,
    )

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'again' })
  })

  it('appends one log entry holding the card before and after', async () => {
    const entered = MemoryCard.entered(lessonFinish)
    const { cards, reviewLog, dependencies } = arrange([ownedBy('school', entered)], lessonFinish)

    await answerReview({ playerId: learner, wordId: 'school', answer: 'home' }, dependencies)

    expect(reviewLog.entries()).toEqual([
      {
        playerId: learner,
        wordId: 'school',
        reviewedAt: lessonFinish,
        format: 'recognition',
        answer: 'home',
        nearMissAnswer: null,
        hintShown: false,
        rating: 'again',
        elapsedDays: null,
        before: entered.stored,
        after: heldCardOf(cards, 'school').card.stored,
      },
    ])
  })

  it('rates a correct typed recall Good and logs its elapsed whole days', async () => {
    const { reviewLog, dependencies } = arrange(
      [ownedBy('school', recallCard)],
      dueAtOf(recallCard),
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: '  School ' },
      dependencies,
    )

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'good' })
    expect(reviewLog.entries()).toMatchObject([{ format: 'recall', elapsedDays: 2 }])
  })

  it('rates a wrong typed recall Again', async () => {
    const { dependencies } = arrange([ownedBy('school', recallCard)], dueAtOf(recallCard))

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'house' },
      dependencies,
    )

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'again' })
  })

  it('rates a correct typed answer after a hint as Hard and clears the pending review', async () => {
    const { pendingReviews, reviewLog, dependencies } = arrange(
      [ownedBy('school', recallCard)],
      dueAtOf(recallCard),
    )
    await pendingReviews.save(learner, 'school', { hintShown: true, nearMissAnswer: null })

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'hard' })
    expect(reviewLog.entries()).toMatchObject([{ hintShown: true }])
    expect(await pendingReviews.pendingReviewOf(learner, 'school')).toBeUndefined()
  })

  it('answers a near-miss with no rating, leaving the card and the log untouched', async () => {
    const { cards, pendingReviews, reviewLog, dependencies } = arrange(
      [ownedBy('school', recallCard)],
      dueAtOf(recallCard),
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'scool' },
      dependencies,
    )

    expect(answered).toEqual({ ok: true, value: { kind: 'nearMiss' } })
    expect(heldCardOf(cards, 'school').card).toBe(recallCard)
    expect(reviewLog.entries()).toEqual([])
    expect(await pendingReviews.pendingReviewOf(learner, 'school')).toEqual({
      hintShown: false,
      nearMissAnswer: 'scool',
    })
  })

  it('rates a correct answer after a near-miss as Hard and logs the near-miss', async () => {
    const { reviewLog, dependencies } = arrange(
      [ownedBy('school', recallCard)],
      dueAtOf(recallCard),
    )
    await answerReview({ playerId: learner, wordId: 'school', answer: 'scool' }, dependencies)

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'hard' })
    expect(reviewLog.entries()).toMatchObject([{ answer: 'school', nearMissAnswer: 'scool' }])
  })

  it('rates a second near-miss in a row Again', async () => {
    const { dependencies } = arrange([ownedBy('school', recallCard)], dueAtOf(recallCard))
    await answerReview({ playerId: learner, wordId: 'school', answer: 'scool' }, dependencies)

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'shcool' },
      dependencies,
    )

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'again' })
  })

  it('earns the skill at the review that brings the last word to retention', async () => {
    const { fiefs, dependencies } = arrange(retainedExceptSchool(firstRecallDoneCard), lastRecallAt)

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    const earned = {
      lessonId: lessonOne.id,
      resource: 'food',
      ratePercent: 5,
      earnedAt: lastRecallAt,
    }
    expect(answered).toMatchObject({ ok: true, value: { earnedSkill: earned } })
    expect(fiefs.storedFiefOf('fief-1')?.skills).toEqual([earned])
  })

  it('earns no skill on a recall that reaches 7 days of stability within a week of the last review', async () => {
    const { fiefs, dependencies } = arrange(retainedExceptSchool(recallCard), dueAtOf(recallCard))

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    assert(answered.ok && answered.value.kind === 'rated')
    expect(answered.value.card.stored.stability).toBeGreaterThanOrEqual(7)
    expect(answered.value.earnedSkill).toBeUndefined()
    expect(fiefs.storedFiefOf('fief-1')?.skills).toEqual([])
  })

  it('earns no skill on a Hard after a hint', async () => {
    const { fiefs, pendingReviews, dependencies } = arrange(
      retainedExceptSchool(firstRecallDoneCard),
      lastRecallAt,
    )
    await pendingReviews.save(learner, 'school', { hintShown: true, nearMissAnswer: null })

    await answerReview({ playerId: learner, wordId: 'school', answer: 'school' }, dependencies)

    expect(fiefs.storedFiefOf('fief-1')?.skills).toEqual([])
  })

  it('keeps the skill after a lapse', async () => {
    const { fiefs, dependencies } = arrange(retainedExceptSchool(firstRecallDoneCard), lastRecallAt)
    await answerReview({ playerId: learner, wordId: 'school', answer: 'school' }, dependencies)
    const homeDueAt = dueAtOf(retainedCard)
    const lapse = { ...dependencies, clock: frozenClock(homeDueAt) }

    const answered = await answerReview(
      { playerId: learner, wordId: 'home', answer: 'house' },
      lapse,
    )

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'again' })
    expect(fiefs.storedFiefOf('fief-1')?.skills).toHaveLength(1)
  })

  it('earns the skill once, never again on a later retained review', async () => {
    const { fiefs, dependencies } = arrange(retainedExceptSchool(firstRecallDoneCard), lastRecallAt)
    await answerReview({ playerId: learner, wordId: 'school', answer: 'school' }, dependencies)
    const later = { ...dependencies, clock: frozenClock(dueAtOf(retainedCard)) }

    const answered = await answerReview(
      { playerId: learner, wordId: 'home', answer: 'home' },
      later,
    )

    assert(answered.ok && answered.value.kind === 'rated')
    expect(answered.value.earnedSkill).toBeUndefined()
    expect(fiefs.storedFiefOf('fief-1')?.skills).toHaveLength(1)
  })

  it('earns the skill for every fief the player holds', async () => {
    const heldFiefs = [
      fiefOfLearner('fief-2', 2, hoursAfter(lastRecallAt, -5)),
      fiefOfLearner('fief-1', 1, hoursAfter(lastRecallAt, -3)),
    ]
    const { fiefs, dependencies } = arrange(
      retainedExceptSchool(firstRecallDoneCard),
      lastRecallAt,
      heldFiefs,
    )

    await answerReview({ playerId: learner, wordId: 'school', answer: 'school' }, dependencies)

    expect(fiefs.storedFiefOf('fief-1')?.skills).toHaveLength(1)
    expect(fiefs.storedFiefOf('fief-2')?.skills).toHaveLength(1)
    expect(fiefs.storedFiefOf('fief-2')?.storedAt).toEqual(lastRecallAt)
  })

  it('raises food by the lesson percent from the instant the skill is earned', async () => {
    const storedAt = hoursAfter(lastRecallAt, -10)
    const { fiefs, dependencies } = arrange(
      retainedExceptSchool(firstRecallDoneCard),
      lastRecallAt,
      [fiefOfLearner('fief-1', 1, storedAt)],
    )

    await answerReview({ playerId: learner, wordId: 'school', answer: 'school' }, dependencies)

    const earnedFief = fiefs.storedFiefOf('fief-1')
    expect(foodAt(earnedFief, lastRecallAt)).toBe(100 + 10 * 20)
    expect(foodAt(earnedFief, hoursAfter(lastRecallAt, 10))).toBe(100 + 10 * 20 + 10 * 21)
  })

  it('credits no stock for a correct answer', async () => {
    const now = dueAtOf(recallCard)
    const fief = fiefOfLearner('fief-1', 1, hoursAfter(now, -2))
    const { fiefs, dependencies } = arrange([ownedBy('school', recallCard)], now, [fief])
    const stocksBefore = materializeStocks(fief, catalog, now)

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'good' })
    const stored = fiefs.storedFiefOf('fief-1')
    assert(stored !== undefined)
    expect(materializeStocks(stored, catalog, now)).toEqual(stocksBefore)
  })
})
