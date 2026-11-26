import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import { laterFrameFixtures } from '#learning/infrastructure/http/laterFrames.testSupport'
import {
  learningWorld,
  lessonFinishesAt,
  lessonStartsAt,
  loggedFramesOf,
  runSql,
  secondRecallAt,
} from '#learning/infrastructure/http/learningRoutes.testSupport'

describe('the later frames of a placed-out band', () => {
  const world = learningWorld()
  const { readTown, answered, hint, studyLessonOne, dueReviewOf, seedTheFirstRecall } = world
  const { libraryWithALaterFrame, recallOfSchool } = laterFrameFixtures(world)

  const placeOutOfBandOne = async (): Promise<void> => {
    await runSql(
      `INSERT INTO placements (player_id, kind, decided_at) SELECT id, 'taken', '${lessonStartsAt}' FROM players`,
    )
    await runSql(
      `INSERT INTO placement_scores (player_id, band, score, taken_at) SELECT id, 1, 29, '${lessonStartsAt}' FROM players`,
    )
  }

  beforeEach(() => {
    world.app = createApp({
      ...world.server,
      clock: world.clock,
      lessons: libraryWithALaterFrame(),
    })
  })

  it('shows a later frame in recall once the stage reaches its lesson', async () => {
    const player = await seedTheFirstRecall()
    await placeOutOfBandOne()

    expect(await recallOfSchool(player)).toMatchObject({
      gappedFrame: [{ text: 'My ____ is new.', support: null }],
    })
  })

  it('shows the recall frame first shown again though the stage has grown since', async () => {
    const player = await seedTheFirstRecall()
    await recallOfSchool(player)
    await placeOutOfBandOne()

    expect(await recallOfSchool(player)).toMatchObject({
      gappedFrame: [{ text: "We're at ____.", support: null }],
    })
  })

  it('logs the frame the recall showed though the stage admits another at the answer', async () => {
    const player = await seedTheFirstRecall()
    await recallOfSchool(player)
    await placeOutOfBandOne()

    await answered(player, 'lesson-1-2', 'school')

    expect(await loggedFramesOf('lesson-1-2')).toEqual(["We're at ____."])
  })

  it('logs the later frame a recall showed', async () => {
    const player = await seedTheFirstRecall()
    await placeOutOfBandOne()
    await recallOfSchool(player)

    await answered(player, 'lesson-1-2', 'school')

    expect(await loggedFramesOf('lesson-1-2')).toEqual(['My ____ is new.'])
  })

  it('logs the frame shown through a hint and a near-miss', async () => {
    const player = await seedTheFirstRecall()
    await recallOfSchool(player)
    await placeOutOfBandOne()
    await hint(player, 'lesson-1-2')
    await answered(player, 'lesson-1-2', 'scool')

    await answered(player, 'lesson-1-2', 'school')

    expect(await loggedFramesOf('lesson-1-2')).toEqual(["We're at ____."])
  })

  it('chooses the recall frame anew once the review is rated', async () => {
    const player = await seedTheFirstRecall()
    await recallOfSchool(player)
    await placeOutOfBandOne()
    await answered(player, 'lesson-1-2', 'school')
    world.clock.setTo(secondRecallAt)

    expect(await recallOfSchool(player)).toMatchObject({
      gappedFrame: [{ text: 'My ____ is new.', support: null }],
    })
  })

  it('shows the anchor in recognition though the stage reaches a later frame', async () => {
    const player = await studyLessonOne()
    await placeOutOfBandOne()
    world.clock.setTo(lessonFinishesAt)

    expect(await dueReviewOf(player, 'lesson-1-2')).toMatchObject({
      mode: 'recognition',
      frame: [{ text: "We're at school.", support: null }],
    })
  })

  it('reads a word with its anchor though the stage reaches a later frame', async () => {
    const player = await studyLessonOne()
    await placeOutOfBandOne()
    world.clock.setTo(lessonFinishesAt)

    const { lessons } = await readTown(player)

    expect(lessons[0]?.words[1]?.reading).toEqual({
      word: 'school',
      frame: [{ text: "We're at school.", support: null }],
    })
  })
})
