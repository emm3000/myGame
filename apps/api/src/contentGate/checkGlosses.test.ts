import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { checkGlosses } from './checkGlosses'
import {
  contentOf,
  entryOf,
  lessonOneFrameWords,
  lessonOneInflections,
  lessonOneLexicon,
  structureOf,
} from './contentGate.testSupport'
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
    const glosslessHome = entryOf('lesson-1-1', 'home', 'This is my home.', {
      gloss: {},
      definition: 'we have food at this',
    })

    expect(
      checkGlosses(contentOf({ lexicon: [glosslessHome, ...lessonOneLexicon.slice(1)] })),
    ).toEqual(['lesson-1-1: home is taught by lesson-1 without an es gloss'])
  })

  it('passes an untaught word without a gloss', () => {
    const untaughtTown = entryOf('word-1', 'town', 'This is my town.', { gloss: {} })

    expect(checkGlosses(contentOf({ lexicon: [...lessonOneLexicon, untaughtTown] }))).toEqual([])
  })
})

const homeDefined = (definition: string | undefined) =>
  contentOf({
    lexicon: [
      entryOf('lesson-1-1', 'home', 'This is my home.', { definition }),
      ...lessonOneLexicon.slice(1),
    ],
  })

describe('content gate check 5, glossary completeness for none', () => {
  it('fails a taught word without a definition', () => {
    expect(checkGlosses(homeDefined(undefined))).toEqual([
      'lesson-1-1: home is taught by lesson-1 without a definition',
    ])
  })

  it('passes an untaught word without a definition', () => {
    const untaughtTown = entryOf('word-1', 'town', 'This is my town.')

    expect(checkGlosses(contentOf({ lexicon: [...lessonOneLexicon, untaughtTown] }))).toEqual([])
  })

  it('fails a definition holding a word outside the frame words and band 1', () => {
    expect(checkGlosses(homeDefined('the place we have food at'))).toEqual([
      'lesson-1-1: the definition of home holds place, neither a frame word nor a band 1 word',
    ])
  })

  it('fails a definition holding a word of band 2', () => {
    const ranks = new Map([...contentOf().ranks, ['house', 1500]])
    const forms = new Map([...contentOf().forms, ['house', new Set(['house'])]])
    const content = contentOf({
      lexicon: [
        entryOf('lesson-1-1', 'home', 'This is my home.', { definition: 'we have a house' }),
        ...lessonOneLexicon.slice(1),
      ],
      ranks,
      forms,
    })

    expect(checkGlosses(content)).toEqual([
      'lesson-1-1: the definition of home holds a, neither a frame word nor a band 1 word',
      'lesson-1-1: the definition of home holds house, neither a frame word nor a band 1 word',
    ])
  })

  it('passes a definition of frame words and band 1 words in any of their forms', () => {
    expect(checkGlosses(homeDefined('we are at this for work'))).toEqual([])
  })

  it('passes a definition holding a frame word with no band 1 rank', () => {
    const content = contentOf({
      lexicon: [
        entryOf('lesson-1-1', 'home', 'This is my home.', { definition: 'we have food at this' }),
        entryOf('lesson-1-2', 'school', 'We are at school.', {
          definition: 'they work at this for money, whom we have',
        }),
        ...lessonOneLexicon.slice(2),
      ],
      structures: [structureOf('lesson-1', [...lessonOneFrameWords, 'whom'], lessonOneInflections)],
      forms: new Map([...contentOf().forms, ['whom', new Set(['whom'])]]),
    })

    expect(checkGlosses(content)).toEqual([])
  })

  it('fails a card word whose definition holds its own word', () => {
    expect(checkGlosses(homeDefined('we have food at home'))).toEqual([
      'lesson-1-1: the definition of home holds home, a form of its card word home',
    ])
  })

  it('fails a card word whose definition holds its own word in another form', () => {
    expect(checkGlosses(homeDefined('we have food at our homes'))).toEqual([
      'lesson-1-1: the definition of home holds homes, a form of its card word home',
    ])
  })
})

describe('content gate check 5, the definitions of units', () => {
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
