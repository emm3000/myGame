import { describe, expect, it } from 'vitest'
import { TextsContentSchema } from '../index'

const atTheStation = {
  id: 'text-1',
  fromLessonId: 'lesson-31',
  title: 'At the station',
  sentences: ['I go to the station.', 'The truck is there.'],
}

describe('TextsContentSchema', () => {
  it('parses a text with its lesson, title and sentences', () => {
    expect(TextsContentSchema.parse([atTheStation])).toEqual([atTheStation])
  })

  it('parses a text with the homographs and forms in no card sense a frame carries', () => {
    const leftEarly = { ...atTheStation, homographs: { left: 'leave' }, noCardSense: ['like'] }

    expect(TextsContentSchema.parse([leftEarly])).toEqual([leftEarly])
  })

  it('refuses a text with no sentence', () => {
    expect(TextsContentSchema.safeParse([{ ...atTheStation, sentences: [] }]).success).toBe(false)
  })

  it('refuses a text with an unknown field', () => {
    expect(TextsContentSchema.safeParse([{ ...atTheStation, author: 'mayor' }]).success).toBe(false)
  })

  it('refuses an empty list of forms in no card sense', () => {
    expect(TextsContentSchema.safeParse([{ ...atTheStation, noCardSense: [] }]).success).toBe(false)
  })
})
