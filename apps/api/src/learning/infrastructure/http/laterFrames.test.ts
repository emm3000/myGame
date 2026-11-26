import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import { laterFrameFixtures } from './laterFrames.testSupport'
import { learningWorld, loggedFramesOf } from './learningRoutes.testSupport'

describe('the later frames', () => {
  const world = learningWorld()
  const { answered, studyToTheFirstRecall, seedTheFirstRecall } = world
  const { libraryWithALaterFrame, recallOfSchool } = laterFrameFixtures(world)

  beforeEach(() => {
    world.app = createApp({
      ...world.server,
      clock: world.clock,
      lessons: libraryWithALaterFrame(),
    })
  })

  it('shows the anchor in recall while the stage reaches no later frame', async () => {
    const player = await seedTheFirstRecall()

    expect(await recallOfSchool(player)).toMatchObject({
      gappedFrame: [{ text: "We're at ____.", support: null }],
    })
  })

  it('logs the full anchor each recognition showed', async () => {
    await studyToTheFirstRecall()

    expect(await loggedFramesOf('lesson-1-2')).toEqual(["We're at school.", "We're at school."])
  })

  it('logs no frame for an answer no read showed', async () => {
    const player = await seedTheFirstRecall()

    await answered(player, 'lesson-1-2', 'school')

    expect(await loggedFramesOf('lesson-1-2')).toEqual([null])
  })
})
