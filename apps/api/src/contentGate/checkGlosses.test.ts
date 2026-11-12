import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { checkGlosses } from './checkGlosses'
import { contentOf, entryOf, lessonOneLexicon } from './contentGate.testSupport'
import { gateContentOf } from './gateContentOf'

const workOnDefined = (definition: string) =>
  contentOf({
    lexicon: [
      ...lessonOneLexicon,
      entryOf('unit-1', 'work on', 'We work on the food.', { source: 'phave', definition }),
    ],
  })

const shippedContent = fileURLToPath(new URL('../../content/', import.meta.url))

describe('content gate check 5, glossary completeness for es', () => {
  it('passes the shipped lessons', () => {
    expect(checkGlosses(gateContentOf(shippedContent))).toEqual([])
  })

  it('fails a taught word without an es gloss', () => {
    const glosslessHome = entryOf('lesson-1-1', 'home', 'This is my home.', { gloss: {} })

    expect(
      checkGlosses(contentOf({ lexicon: [glosslessHome, ...lessonOneLexicon.slice(1)] })),
    ).toEqual(['lesson-1-1: home is taught by lesson-1 without an es gloss'])
  })

  it('passes an untaught word without a gloss', () => {
    const untaughtTown = entryOf('word-1', 'town', 'This is my town.', { gloss: {} })

    expect(checkGlosses(contentOf({ lexicon: [...lessonOneLexicon, untaughtTown] }))).toEqual([])
  })
  it('fails a unit whose definition holds its own word', () => {
    expect(checkGlosses(workOnDefined('to work at a thing'))).toEqual([
      'unit-1: the definition of work on holds work, a form of its card word work',
    ])
  })

  it('fails a unit whose definition holds its own word in another form', () => {
    expect(checkGlosses(workOnDefined('to do what you worked for'))).toEqual([
      'unit-1: the definition of work on holds worked, a form of its card word work',
    ])
  })

  it('passes a unit whose definition holds only its frame word of its own words', () => {
    expect(checkGlosses(workOnDefined('to go on with a thing'))).toEqual([])
  })
})
