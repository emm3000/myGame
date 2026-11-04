import { describe, expect, it } from 'vitest'
import { gradeTypedAnswer } from './gradeTypedAnswer'

const headwords = new Set(['foot', 'house', 'school', 'food', 'home'])

const isHeadword = (word: string): boolean => headwords.has(word)

describe('gradeTypedAnswer', () => {
  it('accepts the word after trimming and lower-casing', () => {
    expect(gradeTypedAnswer('  School ', ['school'], isHeadword)).toBe('correct')
  })

  it('reads the typographic apostrophe as a straight one and collapses inner spaces', () => {
    expect(gradeTypedAnswer('Don’t   go', ["don't go"], isHeadword)).toBe('correct')
  })

  it('compares after Unicode NFC', () => {
    expect(gradeTypedAnswer('café', ['café'], isHeadword)).toBe('correct')
  })

  it('accepts any further form the content accepts', () => {
    expect(gradeTypedAnswer('works', ['work', 'works'], isHeadword)).toBe('correct')
  })

  it('calls a deleted letter a near-miss', () => {
    expect(gradeTypedAnswer('scool', ['school'], isHeadword)).toBe('nearMiss')
  })

  it('calls two adjacent letters swapped a near-miss', () => {
    expect(gradeTypedAnswer('shcool', ['school'], isHeadword)).toBe('nearMiss')
  })

  it('calls an inserted or a changed letter a near-miss', () => {
    expect(gradeTypedAnswer('schoool', ['school'], isHeadword)).toBe('nearMiss')
    expect(gradeTypedAnswer('fod', ['food'], isHeadword)).toBe('nearMiss')
    expect(gradeTypedAnswer('schoal', ['school'], isHeadword)).toBe('nearMiss')
  })

  it('rates a distance-1 answer that is itself a headword as wrong', () => {
    expect(gradeTypedAnswer('foot', ['food'], isHeadword)).toBe('wrong')
  })

  it('allows no near-miss against a form of fewer than 4 letters', () => {
    expect(gradeTypedAnswer('ca', ['cat'], isHeadword)).toBe('wrong')
  })

  it('rates an answer two edits away as wrong', () => {
    expect(gradeTypedAnswer('scol', ['school'], isHeadword)).toBe('wrong')
  })
})
