import { describe, expect, it } from 'vitest'
import { HoldoutCheckAnswersSchema, HoldoutCheckRequestSchema, HoldoutChecksSchema } from './index'

const askedItem = {
  wordId: 'word-76',
  word: 'say',
  choices: [
    { choiceId: '0a1b2c3d', gloss: 'decir' },
    { choiceId: '4e5f6a7b', gloss: 'tiempo' },
  ],
}

describe('HoldoutChecksSchema', () => {
  it('parses a check due and one asking its words in the placement’s format', () => {
    const checks = {
      checks: [
        { kind: 'due', band: 2, week: 8 },
        { kind: 'asking', band: 1, week: 24, items: [askedItem] },
      ],
    }

    expect(HoldoutChecksSchema.parse(checks)).toEqual(checks)
  })

  it('parses a check begun over no studied held-out word', () => {
    const checks = { checks: [{ kind: 'asking', band: 1, week: 8, items: [] }] }

    expect(HoldoutChecksSchema.parse(checks)).toEqual(checks)
  })

  it('rejects a week ADR 037 holds no check at', () => {
    expect(
      HoldoutChecksSchema.safeParse({ checks: [{ kind: 'due', band: 1, week: 12 }] }).success,
    ).toBe(false)
  })
})

describe('HoldoutCheckRequestSchema', () => {
  it('reads the band and the week from the path', () => {
    expect(HoldoutCheckRequestSchema.parse({ band: '1', week: '24' })).toEqual({
      band: 1,
      week: 24,
    })
  })

  it('rejects a week with no check', () => {
    expect(HoldoutCheckRequestSchema.safeParse({ band: '1', week: '9' }).success).toBe(false)
  })

  it('rejects a band the curriculum lacks', () => {
    expect(HoldoutCheckRequestSchema.safeParse({ band: '4', week: '8' }).success).toBe(false)
  })
})

describe('HoldoutCheckAnswersSchema', () => {
  it('parses one choice per asked word', () => {
    const answers = { answers: [{ wordId: 'word-76', choiceId: '0a1b2c3d' }] }

    expect(HoldoutCheckAnswersSchema.parse(answers)).toEqual(answers)
  })

  it('parses no answer for a check that asks no word', () => {
    expect(HoldoutCheckAnswersSchema.parse({ answers: [] })).toEqual({ answers: [] })
  })
})
