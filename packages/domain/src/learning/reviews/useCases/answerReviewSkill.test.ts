import { assert, describe, expect, it } from 'vitest'
import { MemoryCard } from '#memory/domain/MemoryCard'
import type { Job } from '#town/jobs/Job'
import { lessonOne } from '../../curriculum/testing/lessonOne'
import {
  arrange,
  dueAtOf,
  earnedFoodSkill,
  factoryFinishedAt,
  farmingTownStoredAt,
  firstRecallDoneCard,
  foodAt,
  frozenClock,
  hoursAfter,
  lastRecallAt,
  learner,
  minutesAfterFinish,
  ownedBy,
  recallCard,
  retainedCard,
  retainedExceptSchool,
  schoolReleasedAt,
  skillsOf,
} from '../testing/answerReviewFixtures'
import { answerReview } from './answerReview'

describe('answerReview', () => {
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

  it('earns no skill for a released lesson', async () => {
    const { skills, dependencies } = arrange(
      retainedExceptSchool(firstRecallDoneCard),
      lastRecallAt,
      [farmingTownStoredAt(lastRecallAt)],
      [schoolReleasedAt(minutesAfterFinish(1))],
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'school', answer: 'school' },
      dependencies,
    )

    expect(answered).toMatchObject({ ok: true, value: { earnedSkill: undefined } })
    expect(await skillsOf(skills)).toEqual([])
  })

  it('never holds back a lesson’s skill on its released word', async () => {
    const { dependencies } = arrange(
      [
        ownedBy('home', retainedCard),
        ownedBy('work', retainedCard),
        ownedBy('money', retainedCard),
        ownedBy('food', firstRecallDoneCard),
        ownedBy('school', MemoryCard.entered(lastRecallAt)),
      ],
      lastRecallAt,
      [farmingTownStoredAt(lastRecallAt)],
      [schoolReleasedAt(minutesAfterFinish(1))],
    )

    const answered = await answerReview(
      { playerId: learner, wordId: 'food', answer: 'food' },
      dependencies,
    )

    expect(answered).toMatchObject({ ok: true, value: { earnedSkill: earnedFoodSkill } })
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
    await pendingReviews.save(learner, 'school', {
      hintShown: true,
      nearMissAnswer: null,
      shownFrame: null,
    })

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
    const { towns, dependencies } = arrange(
      retainedExceptSchool(firstRecallDoneCard),
      lastRecallAt,
      [farmingTownStoredAt(hoursAfter(lastRecallAt, -5))],
    )

    await answerReview({ playerId: learner, wordId: 'school', answer: 'school' }, dependencies)

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
