import type { GrammarPassage } from './grammarPassagesOf'
import type { GrammarTerms } from './grammarTermsOf'
import { grammarCardEntryOf, grammarWordOf } from './grammarWordOf'

type Window = ReadonlyArray<string | undefined>

type StructurePattern = {
  readonly name: string
  readonly heldLength: number
  readonly matches: (window: Window, passage: GrammarPassage, terms: GrammarTerms) => boolean
}

const frameWordVerbs: ReadonlySet<string> = new Set(['be', 'have', 'do'])

const isPartOfSpeech =
  (partOfSpeech: string) =>
  (token: string | undefined, passage: GrammarPassage, terms: GrammarTerms): boolean =>
    grammarCardEntryOf(token, passage, terms)?.partOfSpeech === partOfSpeech

const isAdjective = isPartOfSpeech('adjective')

const isNoun = isPartOfSpeech('noun')

const isVerb = isPartOfSpeech('verb')

const isVerbInItsOwnForm = (
  token: string | undefined,
  passage: GrammarPassage,
  terms: GrammarTerms,
): boolean => {
  const word = grammarWordOf(token, passage, terms)
  return (
    word !== undefined &&
    word === token &&
    (frameWordVerbs.has(word) || isVerb(token, passage, terms))
  )
}

const unadmittedPatterns: ReadonlyArray<StructurePattern> = [
  {
    name: 'used to with a verb',
    heldLength: 3,
    matches: ([used, to, verb], passage, terms) =>
      used === 'used' && to === 'to' && isVerbInItsOwnForm(verb, passage, terms),
  },
  {
    name: 'so with an adjective',
    heldLength: 2,
    matches: ([so, adjective], passage, terms) =>
      so === 'so' && isAdjective(adjective, passage, terms),
  },
  {
    name: 'more with an adjective',
    heldLength: 2,
    matches: ([more, adjective, after], passage, terms) =>
      more === 'more' && isAdjective(adjective, passage, terms) && !isNoun(after, passage, terms),
  },
]

const sentenceFailures = (
  sentence: ReadonlyArray<string>,
  passage: GrammarPassage,
  terms: GrammarTerms,
): ReadonlyArray<string> =>
  sentence.flatMap((_, start) => {
    const window = [sentence[start], sentence[start + 1], sentence[start + 2]]
    return unadmittedPatterns
      .filter(({ matches }) => matches(window, passage, terms))
      .map(
        ({ name, heldLength }) =>
          `${passage.label}: ${passage.kind} holds ${sentence.slice(start, start + heldLength).join(' ')}, ${name}, a structure grammar.json does not admit`,
      )
  })

const isSpokenPassage = ({ kind }: GrammarPassage): boolean => kind === 'frame' || kind === 'text'

export const structureFailuresOf = (
  passages: ReadonlyArray<GrammarPassage>,
  terms: GrammarTerms,
): ReadonlyArray<string> =>
  passages
    .filter(isSpokenPassage)
    .flatMap((passage) =>
      passage.sentences.flatMap((sentence) => sentenceFailures(sentence, passage, terms)),
    )
