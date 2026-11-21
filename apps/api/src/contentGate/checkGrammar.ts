import type { LexiconEntry } from '../adapters/json/lessonContentFilesOf'
import { cardWordFormOf, type IrregularForms } from './cardWordFormOf'
import { frameWordAdmissionsOf } from './frameWordAdmissionsOf'
import type { GateContent } from './GateContent'
import { type GrammarPassage, grammarPassagesOf } from './grammarPassagesOf'
import { inventoryFailuresOf } from './inventoryFailuresOf'
import { lessonPositionOf } from './lessonPositionOf'
import { readingOf } from './readingOf'
import { type ReadingTerms, readingTermsOf } from './readingTermsOf'

type GrammarTerms = {
  readonly reading: ReadingTerms
  readonly frameWordsAdmittedAt: ReadonlyMap<string, number>
  readonly inflectionsAdmittedAt: ReadonlyMap<string, number>
  readonly cardWords: ReadonlyMap<string, LexiconEntry>
  readonly irregularVerbs: ReadonlyMap<string, IrregularForms>
}

type PassageToken = {
  readonly token: string
  readonly previous: string | undefined
  readonly isAfterHave: boolean
}

const haveForms: ReadonlySet<string> = new Set(['have', 'has', "'s"])

const subjectPronouns: ReadonlySet<string> = new Set(['i', 'you', 'he', 'she', 'it', 'we', 'they'])

const perfectAdverbs: ReadonlySet<string> = new Set([
  'not',
  "n't",
  'never',
  'just',
  'already',
  'ever',
])

const followsHave = (earlier: ReadonlyArray<string>): boolean => {
  const [last, beforeLast] = earlier.filter((token) => !perfectAdverbs.has(token)).toReversed()
  const host = last !== undefined && subjectPronouns.has(last) ? beforeLast : last
  return host !== undefined && haveForms.has(host)
}

const passageTokensOf = (tokens: ReadonlyArray<string>): ReadonlyArray<PassageToken> =>
  tokens.map((token, index) => ({
    token,
    previous: tokens[index - 1],
    isAfterHave: followsHave(tokens.slice(0, index)),
  }))

const termsOf = (content: GateContent): GrammarTerms => {
  const positionOf = (lessonId: string): number => lessonPositionOf(content.curriculum, lessonId)
  return {
    reading: readingTermsOf(content),
    frameWordsAdmittedAt: frameWordAdmissionsOf(content),
    inflectionsAdmittedAt: new Map(
      content.grammar.structures.flatMap(({ inflections, admittingLessonId }) =>
        inflections.map((inflection) => [inflection, positionOf(admittingLessonId)] as const),
      ),
    ),
    cardWords: new Map(content.lexicon.map((entry) => [entry.lemma, entry])),
    irregularVerbs: new Map(
      content.grammar.irregularVerbs.map(
        ({ lemma, past, pastParticiple }) => [lemma, { past, pastParticiple }] as const,
      ),
    ),
  }
}

const isAdmittedBy = (admittedAt: number | undefined, { position }: GrammarPassage): boolean =>
  admittedAt !== undefined && admittedAt <= position

const articleOf = (inflection: string): string => (/^[-aeiou]/.test(inflection) ? 'an' : 'a')

const inflectionFailures = (
  token: string,
  inflection: string,
  passage: GrammarPassage,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  const admittedAt = terms.inflectionsAdmittedAt.get(inflection)
  if (isAdmittedBy(admittedAt, passage)) {
    return []
  }
  const label =
    inflection === token ? 'an inflection' : `${articleOf(inflection)} ${inflection} inflection`
  const holding = `${passage.label}: ${passage.kind} holds ${token}, ${label}`
  return admittedAt === undefined
    ? [`${holding} no structure admits`]
    : [`${holding} admitted after ${passage.lessonId}`]
}

const frameWordFormFailures = (
  token: string,
  word: string,
  passage: GrammarPassage,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  if (token !== word) {
    return inflectionFailures(token, token, passage, terms)
  }
  return isAdmittedBy(terms.frameWordsAdmittedAt.get(word), passage)
    ? []
    : [
        `${passage.label}: ${passage.kind} holds ${token}, a frame word admitted after ${passage.lessonId}`,
      ]
}

const cardWordFailures = (
  { token, isAfterHave }: PassageToken,
  entry: LexiconEntry,
  passage: GrammarPassage,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  const form = cardWordFormOf(token, entry, { irregularVerbs: terms.irregularVerbs, isAfterHave })
  switch (form.kind) {
    case 'ungated':
      return []
    case 'inflected':
      return inflectionFailures(token, form.inflection, passage, terms)
    case 'unlistedPast':
      return [
        `${passage.label}: ${passage.kind} holds ${token}, a form of ${entry.lemma} the irregular verb list does not name`,
      ]
  }
}

const isContractionPiece = (token: string): boolean => token.startsWith("'") || token === "n't"

const isBeHost = (
  previous: string | undefined,
  passage: GrammarPassage,
  terms: GrammarTerms,
): boolean => {
  const reading = previous === undefined ? undefined : readingOf(previous, passage, terms.reading)
  return (
    reading?.kind === 'word' &&
    (terms.frameWordsAdmittedAt.has(reading.word) ||
      terms.cardWords.get(reading.word)?.partOfSpeech === 'adverb')
  )
}

const pieceFailures = (
  { token, previous }: PassageToken,
  passage: GrammarPassage,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  const isPossessive = token === "'s" && !isBeHost(previous, passage, terms)
  return inflectionFailures(token, isPossessive ? "possessive 's" : token, passage, terms)
}

const tokenFailures = (
  passageToken: PassageToken,
  passage: GrammarPassage,
  terms: GrammarTerms,
): ReadonlyArray<string> => {
  const { token } = passageToken
  if (isContractionPiece(token)) {
    return pieceFailures(passageToken, passage, terms)
  }
  const reading = readingOf(token, passage, terms.reading)
  if (reading.kind !== 'word') {
    return []
  }
  if (terms.frameWordsAdmittedAt.has(reading.word)) {
    return frameWordFormFailures(token, reading.word, passage, terms)
  }
  const cardWord = terms.cardWords.get(reading.word)
  return cardWord === undefined ? [] : cardWordFailures(passageToken, cardWord, passage, terms)
}

const passageFailures = (content: GateContent): ReadonlyArray<string> => {
  const terms = termsOf(content)
  return grammarPassagesOf(content).flatMap((passage) =>
    passageTokensOf(passage.tokens).flatMap((passageToken) =>
      tokenFailures(passageToken, passage, terms),
    ),
  )
}

export const checkGrammar = (content: GateContent): ReadonlyArray<string> => [
  ...inventoryFailuresOf(content),
  ...passageFailures(content),
]
