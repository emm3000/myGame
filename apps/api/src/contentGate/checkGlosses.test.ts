import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { checkGlosses } from './checkGlosses'
import { contentOf, entryOf, lessonOneLexicon } from './contentGate.testSupport'
import { gateContentOf } from './gateContentOf'

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
})
