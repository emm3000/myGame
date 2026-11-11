import { assert, describe, expect, it } from 'vitest'
import type { HeldCard } from '../learning/HeldCard'
import { recognitionChoicesOf } from '../learning/recognitionChoicesOf'
import { dueInstantOf } from '../memory/dueInstantOf'
import { MemoryCard } from '../memory/MemoryCard'
import type { MemoryRating } from '../memory/MemoryRating'
import { defaultMemoryTerms } from '../memory/MemoryTerms'
import { reviewMemoryCard } from '../memory/reviewMemoryCard'
import type { Clock } from '../ports/Clock'
import { inMemoryCards, type OwnedCard } from '../testing/inMemoryCards'
import { inMemoryEarnedSkills } from '../testing/inMemoryEarnedSkills'
import { inMemoryLessons } from '../testing/inMemoryLessons'
import { inMemoryPendingReviews } from '../testing/inMemoryPendingReviews'
import { inMemoryReviewLog } from '../testing/inMemoryReviewLog'
import { inMemoryTownNews } from '../testing/inMemoryTownNews'
import { type InMemoryTowns, inMemoryTowns } from '../testing/inMemoryTowns'
import { lessonOne } from '../testing/lessonOne'
import { townCatalogOf } from '../testing/townCatalogOf'
import { type TownShape, townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import { accrueTown } from '../town/accrueTown'
import type { WorkSlot } from '../town/BuildingWork'
import type { EarnedSkillRepository } from '../town/EarnedSkillRepository'
import type { Job } from '../town/Job'
import { Town } from '../town/Town'
import type { TownRepository } from '../town/TownRepository'
import type { TownSkill } from '../town/TownSkill'
import { answerReview } from './answerReview'

const MILLISECONDS_PER_MINUTE = 60_000

const lessonFinish = Instant.fromEpochMilliseconds(1_794_301_200_000)

const minutesAfterFinish = (minutes: number): Instant =>
  Instant.fromEpochMilliseconds(lessonFinish.epochMilliseconds + minutes * MILLISECONDS_PER_MINUTE)

const frozenClock = (instant: Instant): Clock => ({ now: () => instant })

const learner = 'player-1'

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

const cardsOfLessonOne: ReadonlyArray<HeldCard> = lessonOne.words.map(({ id }) => ({
  wordId: id,
  card: MemoryCard.entered(lessonFinish),
}))

const choiceIdOf = (askedWordId: string, chosenWordId: string, card: MemoryCard): string => {
  const choice = recognitionChoicesOf(askedWordId, lessonOne, card, cardsOfLessonOne).find(
    ({ wordId }) => wordId === chosenWordId,
  )
  assert(choice !== undefined)
  return choice.choiceId
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

const catalog = townCatalogOf()

const lastRecallAt = dueAtOf(firstRecallDoneCard)

const retainedExceptSchool = (schoolCard: MemoryCard): ReadonlyArray<OwnedCard> => [
  ownedBy('home', retainedCard),
  ownedBy('work', retainedCard),
  ownedBy('money', retainedCard),
  ownedBy('food', retainedCard),
  ownedBy('school', schoolCard),
]

const farmingTownStoredAt = (storedAt: Instant, shape: Partial<TownShape> = {}): Town =>
  townOf({ area: 2, buildingLevels: { farm: 2 }, storedAt, ...shape })

const earnedFoodSkill: TownSkill = {
  lessonId: lessonOne.id,
  resource: 'food',
  ratePercent: 5,
  earnedAt: lastRecallAt,
}

const arrange = (
  owned: ReadonlyArray<OwnedCard>,
  now: Instant,
  heldTowns: ReadonlyArray<Town> = [farmingTownStoredAt(now)],
) => {
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
    clock: frozenClock(now),
    terms: defaultMemoryTerms,
    skills,
    towns,
    news,
    catalog,
  }
  return { towns, skills, news, cards, pendingReviews, reviewLog, dependencies }
}

const skillsOf = async (skills: EarnedSkillRepository): Promise<ReadonlyArray<TownSkill>> => {
  const earned = await skills.skillsOf(learner)
  assert(earned.ok)
  return earned.value
}

const foodAt = (town: Town | undefined, at: Instant): number => {
  assert(town !== undefined)
  const accrual = accrueTown(town, catalog, at)
  assert(accrual.ok)
  return accrual.value.stocks.food
}

const townsLoadingSkillsFrom = (
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

const factoryFinishedAt = (finishesAt: Instant, startedAt: Instant): WorkSlot => ({
  kind: 'busy',
  building: 'factory',
  level: 1,
  cost: { money: 0, food: 0, power: 0, material: 0 },
  startedAt,
  finishesAt,
})

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
      { playerId: learner, wordId: 'school', answer: choiceIdOf('school', 'school', entered) },
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
    const entered = MemoryCard.entered(lessonFinish)
    const { dependencies } = arrange(
      [ownedBy('school', entered), ownedBy('home', entered)],
      lessonFinish,
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: choiceIdOf('school', 'home', entered) },
      dependencies,
    )

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'again' })
  })

  it('refuses a recognition answer that is none of its choice ids, writing nothing', async () => {
    const entered = MemoryCard.entered(lessonFinish)
    const { cards, reviewLog, dependencies } = arrange([ownedBy('school', entered)], lessonFinish)

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    expect(answered).toEqual({ ok: false, error: { kind: 'UnknownChoice', wordId: 'school' } })
    expect([heldCardOf(cards, 'school').card, reviewLog.entries()]).toEqual([entered, []])
  })

  it('appends one log entry holding the card before and after', async () => {
    const entered = MemoryCard.entered(lessonFinish)
    const { cards, reviewLog, dependencies } = arrange(
      [ownedBy('school', entered), ownedBy('home', entered)],
      lessonFinish,
    )
    const homeChoiceId = choiceIdOf('school', 'home', entered)

    await answerReview({ playerId: learner, wordId: 'school', answer: homeChoiceId }, dependencies)

    expect(reviewLog.entries()).toEqual([
      {
        playerId: learner,
        wordId: 'school',
        reviewedAt: lessonFinish,
        format: 'recognition',
        answer: homeChoiceId,
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
    const { skills, dependencies } = arrange(
      retainedExceptSchool(firstRecallDoneCard),
      lastRecallAt,
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    expect(answered).toMatchObject({ ok: true, value: { earnedSkill: earnedFoodSkill } })
    expect(await skillsOf(skills)).toEqual([earnedFoodSkill])
  })

  it("re-bases the player's town at the earn", async () => {
    const { towns, dependencies } = arrange(
      retainedExceptSchool(firstRecallDoneCard),
      lastRecallAt,
      [farmingTownStoredAt(hoursAfter(lastRecallAt, -5))],
    )

    await answerReview({ playerId: learner, wordId: 'school', answer: 'school' }, dependencies)

    expect(towns.storedTownOf(learner)).toMatchObject({
      storedAt: lastRecallAt,
      skills: [earnedFoodSkill],
    })
  })

  it('records skillEarned in the Town News', async () => {
    const { news, dependencies } = arrange(retainedExceptSchool(firstRecallDoneCard), lastRecallAt)

    await answerReview({ playerId: learner, wordId: 'school', answer: 'school' }, dependencies)

    expect(news.recordedEventsOf('town-1')).toEqual([
      {
        kind: 'skillEarned',
        lessonId: lessonOne.id,
        resource: 'food',
        ratePercent: 5,
        occurredAt: lastRecallAt,
      },
    ])
  })

  it('finishes the building work due before the earn and records its news first', async () => {
    const finishesAt = hoursAfter(lastRecallAt, -1)
    const startedAt = hoursAfter(lastRecallAt, -2)
    const { towns, news, dependencies } = arrange(
      retainedExceptSchool(firstRecallDoneCard),
      lastRecallAt,
      [farmingTownStoredAt(startedAt, { workSlot: factoryFinishedAt(finishesAt, startedAt) })],
    )

    await answerReview({ playerId: learner, wordId: 'school', answer: 'school' }, dependencies)

    expect(towns.storedTownOf(learner)?.buildingLevels.factory).toBe(1)
    expect(news.recordedEventsOf('town-1').map(({ kind }) => kind)).toEqual([
      'buildingWorkFinished',
      'skillEarned',
    ])
  })

  it('returns the team due home before the earn and records its news first', async () => {
    const sentAt = hoursAfter(lastRecallAt, -3)
    const job: Job = {
      kind: 'out',
      site: { region: 1, area: 1, site: 5 },
      team: { worker: 1, truck: 0 },
      hours: 1,
      sentAt,
      oneWaySeconds: 1_800,
      pay: { money: 0, food: 6, power: 0, material: 6 },
      payPercent: { money: 100, food: 100, power: 100, material: 100 },
    }
    const { towns, news, dependencies } = arrange(
      retainedExceptSchool(firstRecallDoneCard),
      lastRecallAt,
      [farmingTownStoredAt(sentAt, { hires: { worker: 1, truck: 0 }, jobSlot: job })],
    )

    await answerReview({ playerId: learner, wordId: 'school', answer: 'school' }, dependencies)

    expect([
      towns.storedTownOf(learner)?.jobSlot,
      news.recordedEventsOf('town-1').map(({ kind }) => kind),
    ]).toEqual([{ kind: 'idle' }, ['jobBack', 'skillEarned']])
  })

  it('saves only the skill for a player who holds no town', async () => {
    const { skills, news, dependencies } = arrange(
      retainedExceptSchool(firstRecallDoneCard),
      lastRecallAt,
      [],
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    expect(answered).toMatchObject({ ok: true, value: { earnedSkill: earnedFoodSkill } })
    expect(await skillsOf(skills)).toEqual([earnedFoodSkill])
    expect(news.recordedEventsOf('town-1')).toEqual([])
  })

  it('earns no skill on a recall that reaches 7 days of stability within a week of the last review', async () => {
    const { skills, dependencies } = arrange(retainedExceptSchool(recallCard), dueAtOf(recallCard))

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    assert(answered.ok && answered.value.kind === 'rated')
    expect(answered.value.card.stored.stability).toBeGreaterThanOrEqual(7)
    expect(answered.value.earnedSkill).toBeUndefined()
    expect(await skillsOf(skills)).toEqual([])
  })

  it('earns no skill on a Hard after a hint', async () => {
    const { skills, pendingReviews, dependencies } = arrange(
      retainedExceptSchool(firstRecallDoneCard),
      lastRecallAt,
    )
    await pendingReviews.save(learner, 'school', { hintShown: true, nearMissAnswer: null })

    await answerReview({ playerId: learner, wordId: 'school', answer: 'school' }, dependencies)

    expect(await skillsOf(skills)).toEqual([])
  })

  it('keeps the skill after a lapse', async () => {
    const { skills, dependencies } = arrange(
      retainedExceptSchool(firstRecallDoneCard),
      lastRecallAt,
    )
    await answerReview({ playerId: learner, wordId: 'school', answer: 'school' }, dependencies)
    const lapse = { ...dependencies, clock: frozenClock(dueAtOf(retainedCard)) }

    const answered = await answerReview(
      { playerId: learner, wordId: 'home', answer: 'house' },
      lapse,
    )

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'again' })
    expect(await skillsOf(skills)).toHaveLength(1)
  })

  it('earns the skill once, never again on a later retained review', async () => {
    const { towns, skills, dependencies } = arrange(
      retainedExceptSchool(firstRecallDoneCard),
      lastRecallAt,
    )
    await answerReview({ playerId: learner, wordId: 'school', answer: 'school' }, dependencies)
    const later = { ...dependencies, clock: frozenClock(dueAtOf(retainedCard)) }

    const answered = await answerReview(
      { playerId: learner, wordId: 'home', answer: 'home' },
      later,
    )

    assert(answered.ok && answered.value.kind === 'rated')
    expect(answered.value.earnedSkill).toBeUndefined()
    expect(await skillsOf(skills)).toHaveLength(1)
    expect(towns.storedTownOf(learner)?.skills).toHaveLength(1)
  })

  it('raises food by the lesson percent from the instant the skill is earned', async () => {
    const { towns, dependencies } = arrange(
      retainedExceptSchool(firstRecallDoneCard),
      lastRecallAt,
      [farmingTownStoredAt(hoursAfter(lastRecallAt, -5))],
    )

    await answerReview({ playerId: learner, wordId: 'school', answer: 'school' }, dependencies)

    const earnedTown = towns.storedTownOf(learner)
    expect(foodAt(earnedTown, lastRecallAt)).toBe(5 * 60)
    expect(foodAt(earnedTown, hoursAfter(lastRecallAt, 5))).toBe(5 * 60 + 5 * 63)
  })

  it('re-bases a town whose store loads the earned skills with it', async () => {
    const { towns, skills, dependencies } = arrange(
      retainedExceptSchool(firstRecallDoneCard),
      lastRecallAt,
      [farmingTownStoredAt(hoursAfter(lastRecallAt, -5))],
    )

    await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      { ...dependencies, towns: townsLoadingSkillsFrom(towns, skills) },
    )

    const earnedTown = towns.storedTownOf(learner)
    expect(earnedTown?.skills).toEqual([earnedFoodSkill])
    expect(foodAt(earnedTown, lastRecallAt)).toBe(5 * 60)
  })

  it('credits no stock for a correct answer', async () => {
    const now = dueAtOf(recallCard)
    const town = farmingTownStoredAt(hoursAfter(now, -2))
    const { towns, dependencies } = arrange([ownedBy('school', recallCard)], now, [town])

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    assert(answered.ok)
    expect(answered.value).toMatchObject({ kind: 'rated', rating: 'good' })
    expect(towns.storedTownOf(learner)).toBe(town)
  })
})
