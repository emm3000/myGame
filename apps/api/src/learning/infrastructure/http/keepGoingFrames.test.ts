import { type KeepGoingFrames, KeepGoingFramesSchema } from '@mygame/contracts'
import { Client } from 'pg'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '#app'
import {
  databaseUrl,
  learningWorld,
  type Player,
  secondLearningStepAt,
} from './learningRoutes.testSupport'

const rowsOf = async (query: string): Promise<ReadonlyArray<unknown>> => {
  const client = new Client({ connectionString: databaseUrl() })
  await client.connect()
  try {
    return (await client.query(query)).rows
  } finally {
    await client.end()
  }
}

const learnerRows = async (): Promise<ReadonlyArray<ReadonlyArray<unknown>>> =>
  Promise.all([
    rowsOf('SELECT * FROM cards ORDER BY word_id'),
    rowsOf('SELECT * FROM review_log ORDER BY word_id, reviewed_at'),
    rowsOf('SELECT * FROM pending_reviews ORDER BY word_id'),
    rowsOf('SELECT * FROM towns'),
  ])

describe('the frames Keep going offers', () => {
  const world = learningWorld()
  const { send, seedTheFirstRecall } = world

  const readFrames = async (player: Player): Promise<KeepGoingFrames> => {
    const response = await send(player, 'GET', '/town/frames')
    expect(response.status).toBe(200)
    return KeepGoingFramesSchema.parse(await response.json())
  }

  const seedWordsTwoDaysAway = async (): Promise<Player> => {
    const player = await seedTheFirstRecall()
    world.clock.setTo(secondLearningStepAt)
    return player
  }

  beforeEach(() => {
    const { lessons } = world.server
    world.app = createApp({
      ...world.server,
      clock: world.clock,
      lessons: {
        ...lessons,
        keepGoingTerms: () => ({ ...lessons.keepGoingTerms(), wordsPerRead: 2 }),
      },
    })
  })

  it("answers at most the content's cap of words in one read", async () => {
    const player = await seedWordsTwoDaysAway()

    const { words } = await readFrames(player)

    expect(words).toHaveLength(2)
  })

  it('reads the frames without writing a rating, a card, a log row or the town', async () => {
    const player = await seedWordsTwoDaysAway()
    const before = await learnerRows()

    await readFrames(player)

    expect(await learnerRows()).toEqual(before)
  })
})

describe('the frames Keep going offers over the shipped lessons', () => {
  const world = learningWorld()

  it("supports each lesson 1 anchor on its own word's token alone", async () => {
    const player = await world.seedTheFirstRecall()
    world.clock.setTo(secondLearningStepAt)

    const response = await world.send(player, 'GET', '/town/frames')
    const { words } = KeepGoingFramesSchema.parse(await response.json())

    expect(
      words
        .map(({ wordId, frames }) => ({
          wordId,
          supported: frames[0]?.filter(({ support }) => support !== null).map(({ text }) => text),
        }))
        .toSorted((left, right) => left.wordId.localeCompare(right.wordId)),
    ).toEqual([
      { wordId: 'lesson-1-1', supported: ['home'] },
      { wordId: 'lesson-1-2', supported: ['school'] },
      { wordId: 'lesson-1-3', supported: ['work'] },
      { wordId: 'lesson-1-4', supported: ['money'] },
      { wordId: 'lesson-1-5', supported: ['food'] },
    ])
  })
})
