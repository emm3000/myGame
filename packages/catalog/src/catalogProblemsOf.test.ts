import { describe, expect, it } from 'vitest'
import en from '../en.json'
import es from '../es.json'
import { catalogProblemsOf } from './catalogProblemsOf'

describe('catalogProblemsOf', () => {
  it('reports a key of en missing from es', () => {
    const enAhead = { en: { 'town.title': 'Your town' }, es: {} }

    expect(catalogProblemsOf(enAhead)).toEqual([{ kind: 'missingFromEs', key: 'town.title' }])
  })

  it('reports a message that does not parse', () => {
    const unclosedArgument = { en: {}, es: { 'town.fillsAt': 'Se llena a las {time' } }

    expect(catalogProblemsOf(unclosedArgument)).toEqual([
      { kind: 'unparsable', language: 'es', key: 'town.fillsAt' },
    ])
  })

  it('reports two languages naming different arguments for one key', () => {
    const driftedArguments = {
      en: { 'town.fillsAt': 'Fills at {time}' },
      es: { 'town.fillsAt': 'Se llena a las {hour}' },
    }

    expect(catalogProblemsOf(driftedArguments)).toEqual([
      { kind: 'argumentsDiffer', key: 'town.fillsAt' },
    ])
  })

  it('reports a voseo form in es as a whole word, accents included', () => {
    const voseo = { en: {}, es: { 'town.hint': 'Si querés más madera, Mirá el aserradero.' } }

    expect(catalogProblemsOf(voseo)).toEqual([
      { kind: 'voseo', key: 'town.hint', word: 'querés' },
      { kind: 'voseo', key: 'town.hint', word: 'Mirá' },
    ])
  })

  it('leaves a voseo form inside a longer word unreported', () => {
    const tuteo = {
      en: {},
      es: { 'town.hint': 'Vosotros sabéis que el aserradero sostiene el feudo.' },
    }

    expect(catalogProblemsOf(tuteo)).toEqual([])
  })

  it('finds no problem in the shipped catalogs', () => {
    expect(catalogProblemsOf({ en, es })).toEqual([])
  })
})
