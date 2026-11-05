import { describe, expect, it } from 'vitest'
import { ReviewAnswerSchema, ReviewVerdictSchema } from './index'

const verdictSchema = ReviewVerdictSchema

const correct = {
  kind: 'correct',
  word: 'school',
  gloss: 'escuela',
  dueAt: '2026-11-23T09:10:00.000Z',
  earnedSkill: null,
}

const earnedFood = {
  lessonId: 'lesson-1',
  resource: 'material',
  ratePercent: 5,
  earnedAt: '2026-11-23T09:10:00.000Z',
  level: 1,
  ratePerHourBefore: 10,
  ratePerHourAfter: 10.5,
}

describe('ReviewAnswerSchema', () => {
  it('parses a near-miss that names no correct form', () => {
    expect(verdictSchema.parse({ kind: 'nearMiss' })).toEqual({ kind: 'nearMiss' })
  })

  it('rejects a near-miss that gives the word away', () => {
    expect(verdictSchema.safeParse({ kind: 'nearMiss', word: 'school' }).success).toBe(false)
  })

  it('parses a correct answer with the next due instant', () => {
    expect(verdictSchema.parse(correct)).toEqual(correct)
  })

  it('parses the skill a correct answer earns with the rate before and after', () => {
    const earning = { ...correct, earnedSkill: earnedFood }

    expect(verdictSchema.parse(earning)).toEqual(earning)
  })

  it('parses a skill earned without a town, with no rates', () => {
    const earnedSkill = { ...earnedFood, ratePerHourBefore: null, ratePerHourAfter: null }
    const earning = { ...correct, earnedSkill }

    expect(verdictSchema.parse(earning)).toEqual(earning)
  })

  it('rejects a skill earned on a medieval resource', () => {
    const earnedSkill = { ...earnedFood, resource: 'wood' }

    expect(verdictSchema.safeParse({ ...correct, earnedSkill }).success).toBe(false)
  })

  it('rejects an earned skill without the rate before the earn', () => {
    const { ratePerHourBefore: _, ...withoutBefore } = earnedFood

    expect(verdictSchema.safeParse({ ...correct, earnedSkill: withoutBefore }).success).toBe(false)
  })

  it('rejects an earned skill without the level it reached', () => {
    const { level: _, ...withoutLevel } = earnedFood

    expect(verdictSchema.safeParse({ ...correct, earnedSkill: withoutLevel }).success).toBe(false)
  })

  it('parses a wrong answer with the correct form', () => {
    const wrong = {
      kind: 'wrong',
      word: 'home',
      gloss: 'hogar',
      dueAt: '2026-11-12T09:20:00.000Z',
    }

    expect(verdictSchema.parse(wrong)).toEqual(wrong)
  })

  it('rejects a wrong answer that earns a skill', () => {
    const wrong = { ...correct, kind: 'wrong', earnedSkill: null }

    expect(verdictSchema.safeParse(wrong).success).toBe(false)
  })

  it('parses an answer that carries the verdict alone', () => {
    expect(ReviewAnswerSchema.parse({ verdict: { kind: 'nearMiss' } })).toEqual({
      verdict: { kind: 'nearMiss' },
    })
  })

  it('rejects an answer that still carries a fief', () => {
    expect(ReviewAnswerSchema.safeParse({ verdict: { kind: 'nearMiss' }, fief: {} }).success).toBe(
      false,
    )
  })
})
