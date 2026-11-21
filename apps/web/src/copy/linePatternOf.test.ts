import { es } from '@mygame/catalog'
import { expect, it } from 'vitest'
import { linePatternOf } from './linePatternOf.testSupport'

it('matches the line with any text in each hole', () => {
  const pattern = linePatternOf(es.townNextText({ title: 'TITLE' }), ['TITLE'])

  expect(pattern.test(es.townNextText({ title: 'The New Shop' }))).toBe(true)
})

it('refuses a hole the line does not hold', () => {
  expect(() => linePatternOf(es.townNextText({ title: 'TITLE' }), ['PLACE'])).toThrow()
})
