import { ReportSchema } from '@mygame/contracts'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import { laterFrameFixtures } from '#learning/infrastructure/http/laterFrames.testSupport'
import {
  learningWorld,
  lessonStartsAt,
  runSql,
} from '#learning/infrastructure/http/learningRoutes.testSupport'

describe('the recall frames the Report shows', () => {
  const world = learningWorld()
  const { send, seedTheFirstRecall } = world
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

  it('shows the Report the recall frame the reviews route shows', async () => {
    const player = await seedTheFirstRecall()
    await placeOutOfBandOne()

    const report = ReportSchema.parse(await (await send(player, 'GET', '/report')).json())

    expect(report.due.find(({ wordId }) => wordId === 'lesson-1-2')).toEqual(
      await recallOfSchool(player),
    )
  })

  it('shows the recall frame the Report first showed though the stage has grown since', async () => {
    const player = await seedTheFirstRecall()
    await send(player, 'GET', '/report')
    await placeOutOfBandOne()

    expect(await recallOfSchool(player)).toMatchObject({
      gappedFrame: [{ text: "We're at ____.", support: null }],
    })
  })
})
