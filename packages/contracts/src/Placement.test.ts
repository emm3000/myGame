import { describe, expect, it } from 'vitest'
import { PlacementAnswersSchema, PlacementSchema } from './index'

const passedBandOne = {
  band: 1,
  score: 29,
  takenAt: '2026-11-12T09:10:00.000Z',
  isPlacedOut: true,
}

const askedItem = {
  wordId: 'word-76',
  word: 'say',
  choices: [
    { choiceId: '0a1b2c3d', gloss: 'decir' },
    { choiceId: '4e5f6a7b', gloss: 'tiempo' },
    { choiceId: '8c9d0e1f', gloss: 'año' },
    { choiceId: '2a3b4c5d', gloss: 'saber' },
  ],
}

const askingBandTwo = {
  kind: 'asking',
  band: 2,
  items: [askedItem],
  scores: [passedBandOne],
}

describe('PlacementSchema', () => {
  it('parses a placement offered to a player who has neither taken nor skipped one', () => {
    expect(PlacementSchema.parse({ kind: 'offered' })).toEqual({ kind: 'offered' })
  })

  it('parses the band the check asks, its words with their choices and the stored scores', () => {
    expect(PlacementSchema.parse(askingBandTwo)).toEqual(askingBandTwo)
  })

  it('parses a closed placement with its stored scores', () => {
    const closed = { kind: 'closed', scores: [passedBandOne] }

    expect(PlacementSchema.parse(closed)).toEqual(closed)
  })

  it('rejects a band the curriculum lacks', () => {
    expect(PlacementSchema.safeParse({ ...askingBandTwo, band: 4 }).success).toBe(false)
  })

  it('rejects a score above 30', () => {
    const closed = { kind: 'closed', scores: [{ ...passedBandOne, score: 31 }] }

    expect(PlacementSchema.safeParse(closed).success).toBe(false)
  })

  it('rejects a word offered with more than 4 choices', () => {
    const crowded = { ...askedItem, choices: [...askedItem.choices, askedItem.choices[0]] }

    expect(PlacementSchema.safeParse({ ...askingBandTwo, items: [crowded] }).success).toBe(false)
  })

  it('rejects a score that does not say whether its band is placed out', () => {
    const { isPlacedOut: _isPlacedOut, ...unsaid } = passedBandOne

    expect(PlacementSchema.safeParse({ kind: 'closed', scores: [unsaid] }).success).toBe(false)
  })
})

describe('PlacementAnswersSchema', () => {
  const answers = { band: 1, answers: [{ wordId: 'word-76', choiceId: '0a1b2c3d' }] }

  it('parses the band answered and one choice per word', () => {
    expect(PlacementAnswersSchema.parse(answers)).toEqual(answers)
  })

  it('rejects answers with no word', () => {
    expect(PlacementAnswersSchema.safeParse({ ...answers, answers: [] }).success).toBe(false)
  })

  it('rejects more answers than a band asks', () => {
    const tooMany = Array.from({ length: 31 }, (_, index) => ({
      wordId: `word-${index}`,
      choiceId: '0a1b2c3d',
    }))

    expect(PlacementAnswersSchema.safeParse({ ...answers, answers: tooMany }).success).toBe(false)
  })

  it('rejects an answer without its choice', () => {
    expect(
      PlacementAnswersSchema.safeParse({ ...answers, answers: [{ wordId: 'word-76' }] }).success,
    ).toBe(false)
  })
})
