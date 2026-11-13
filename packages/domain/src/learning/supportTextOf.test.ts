import { assert, describe, expect, it } from 'vitest'
import { lessonOne } from '../testing/lessonOne'
import type { LessonWord } from './Lesson'
import { supportTextOf } from './supportTextOf'

const homeOf = (): LessonWord => {
  const [home] = lessonOne.words
  assert(home !== undefined)
  return home
}

describe('supportTextOf', () => {
  it('answers the Spanish gloss for a gloss', () => {
    expect(supportTextOf(homeOf(), { shown: 'beside', help: 'gloss' })).toEqual({
      text: 'hogar',
      language: 'es',
    })
  })

  it('answers the English definition for a definition', () => {
    expect(supportTextOf(homeOf(), { shown: 'onTap', help: 'definition' })).toEqual({
      text: 'the place where you live',
      language: 'en',
    })
  })
})
