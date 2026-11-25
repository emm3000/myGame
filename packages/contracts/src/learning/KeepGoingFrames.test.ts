import { describe, expect, it } from 'vitest'
import { KeepGoingFramesSchema } from '../index'

const besideTown = { shown: 'beside', text: 'pueblo', language: 'es' }

describe('KeepGoingFramesSchema', () => {
  it('reads each offered word with its frames as spans', () => {
    const frames = {
      words: [
        {
          wordId: 'lesson-1-1',
          frames: [
            [
              { text: 'We have a new home in this ', support: null },
              { text: 'town', support: besideTown },
              { text: '.', support: null },
            ],
          ],
        },
      ],
    }

    expect(KeepGoingFramesSchema.parse(frames)).toEqual(frames)
  })

  it('reads a read that offers no word', () => {
    expect(KeepGoingFramesSchema.parse({ words: [] })).toEqual({ words: [] })
  })

  it('rejects an offered word without a frame', () => {
    const frames = { words: [{ wordId: 'lesson-1-1', frames: [] }] }

    expect(KeepGoingFramesSchema.safeParse(frames).success).toBe(false)
  })
})
