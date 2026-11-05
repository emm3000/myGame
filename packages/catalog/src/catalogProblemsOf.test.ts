import { describe, expect, it } from 'vitest'
import en from '../en.json'
import es from '../es.json'
import { catalogProblemsOf } from './catalogProblemsOf'

describe('catalogProblemsOf', () => {
  it('reports a key of en missing from es', () => {
    const enAhead = { en: { 'fief.title': 'Your town' }, es: {} }

    expect(catalogProblemsOf(enAhead)).toEqual([{ kind: 'missingFromEs', key: 'fief.title' }])
  })

  it('reports a message that does not parse', () => {
    const unclosedArgument = { en: {}, es: { 'fief.fillsAt': 'Se llena a las {time' } }

    expect(catalogProblemsOf(unclosedArgument)).toEqual([
      { kind: 'unparsable', language: 'es', key: 'fief.fillsAt' },
    ])
  })

  it('reports two languages naming different arguments for one key', () => {
    const driftedArguments = {
      en: { 'fief.fillsAt': 'Fills at {time}' },
      es: { 'fief.fillsAt': 'Se llena a las {hour}' },
    }

    expect(catalogProblemsOf(driftedArguments)).toEqual([
      { kind: 'argumentsDiffer', key: 'fief.fillsAt' },
    ])
  })

  it('reports a voseo form in es as a whole word, accents included', () => {
    const voseo = { en: {}, es: { 'fief.hint': 'Si querés más madera, Mirá el aserradero.' } }

    expect(catalogProblemsOf(voseo)).toEqual([
      { kind: 'voseo', key: 'fief.hint', word: 'querés' },
      { kind: 'voseo', key: 'fief.hint', word: 'Mirá' },
    ])
  })

  it('leaves a voseo form inside a longer word unreported', () => {
    const tuteo = {
      en: {},
      es: { 'fief.hint': 'Vosotros sabéis que el aserradero sostiene el feudo.' },
    }

    expect(catalogProblemsOf(tuteo)).toEqual([])
  })

  it('finds no problem in the shipped catalogs', () => {
    expect(catalogProblemsOf({ en, es })).toEqual([])
  })
})
